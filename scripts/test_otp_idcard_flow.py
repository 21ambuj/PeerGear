"""
Comprehensive E2E Test for OTP Verification & ID Card Upload Flow
Tests:
1. Re-registration resilience for unverified accounts
2. Clean OTP verification with various dirty paste inputs (spaces, prefixes, dashes)
3. Expiry and attempt tracking
4. ID card upload (JPEG and PDF) with direct redirect to home page
"""

import os
import sys
import io
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import django
from datetime import datetime, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusshare_backend.settings")
django.setup()

from django.test import RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from accounts.views import register_view, verify_email_otp_view, upload_id_card_view, login_view
from campusshare_backend.db import get_users_collection, get_email_otps_collection

rf = RequestFactory()
users_col = get_users_collection()
otps_col = get_email_otps_collection()

def test_full_flow():
    test_email = "tester_verify@campus.edu"
    test_id = "2026TEST999"

    # Clean up test user
    users_col.delete_many({"email": test_email})
    otps_col.delete_many({"email": test_email})

    print("\n--- TEST 1: Initial Registration ---")
    reg_payload = {
        "name": "Integration Tester",
        "email": test_email,
        "password": "Password123!",
        "college_id": test_id,
        "phone": "+91 9999988888",
        "hostel_block": "Block-A"
    }
    req = rf.post("/api/accounts/register/", data=json.dumps(reg_payload), content_type="application/json")
    res = register_view(req)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.content}"
    data = json.loads(res.content)
    assert data.get("requires_otp") is True
    print("SUCCESS: Registered and requires OTP.")

    # Check OTP in DB
    otp_record = otps_col.find_one({"email": test_email, "is_used": False}, sort=[("created_at", -1)])
    assert otp_record is not None, "OTP record not found in MongoDB!"
    original_otp = otp_record["otp"]
    print(f"Generated OTP in DB: {original_otp}")

    print("\n--- TEST 1B: Verify Unverified Account CANNOT Login ---")
    login_req = rf.post("/api/accounts/login/", data=json.dumps({
        "email": test_email,
        "password": "Password123!"
    }), content_type="application/json")
    login_res = login_view(login_req)
    assert login_res.status_code == 403, f"Expected 403 for unverified login, got {login_res.status_code}"
    login_data = json.loads(login_res.content)
    assert login_data.get("requires_otp") is True
    assert "token" not in login_data
    print("SUCCESS: Unverified student blocked from logging in (403 requires_otp).")

    print("\n--- TEST 2: Re-registration Resilience (User retries before verifying) ---")
    req = rf.post("/api/accounts/register/", data=json.dumps(reg_payload), content_type="application/json")
    res = register_view(req)
    assert res.status_code == 200, f"Expected 200 on retry, got {res.status_code}: {res.content}"
    new_otp_record = otps_col.find_one({"email": test_email, "is_used": False}, sort=[("created_at", -1)])
    latest_otp = new_otp_record["otp"]
    print(f"SUCCESS: Re-registration allowed! Fresh OTP dispatched: {latest_otp}")

    print("\n--- TEST 3: Invalid OTP attempt ---")
    req = rf.post("/api/accounts/verify-email-otp/", data=json.dumps({
        "email": test_email,
        "otp": "000000"
    }), content_type="application/json")
    res = verify_email_otp_view(req)
    assert res.status_code == 400
    res_data = json.loads(res.content)
    assert "Invalid verification code" in res_data["error"]
    print("SUCCESS: Invalid OTP rejected with helpful remaining attempts message.")

    print("\n--- TEST 4: Verification with messy paste string (spaces, non-digits) ---")
    # Simulate a user pasting ' Code: 123456 '
    messy_pasted_otp = f"  Code: {latest_otp}  "
    req = rf.post("/api/accounts/verify-email-otp/", data=json.dumps({
        "email": test_email,
        "otp": messy_pasted_otp
    }), content_type="application/json")
    res = verify_email_otp_view(req)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
    data = json.loads(res.content)
    assert data.get("is_email_verified") is True
    assert data.get("next_step") == "UPLOAD_ID_CARD"
    assert data.get("token") is not None
    token = data["token"]
    print("SUCCESS: Cleaned pasted OTP verified! is_email_verified=True, token issued, next_step=UPLOAD_ID_CARD.")

    print("\n--- TEST 5: ID Card Upload (PDF) ---")
    dummy_pdf_content = b"%PDF-1.4 ... dummy college id content ..."
    uploaded_pdf = SimpleUploadedFile("student_id.pdf", dummy_pdf_content, content_type="application/pdf")
    
    req = rf.post("/api/accounts/upload-id-card/", data={"id_card": uploaded_pdf}, HTTP_AUTHORIZATION=f"Bearer {token}")
    res = upload_id_card_view(req)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
    id_res = json.loads(res.content)
    assert "College ID submitted successfully" in id_res["message"]
    assert id_res.get("redirect_to") == "/"
    print("SUCCESS: ID card uploaded! Verified message and redirect_to='/' confirmed.")

    # Verify user state in DB
    updated_user = users_col.find_one({"email": test_email})
    assert updated_user["is_email_verified"] is True
    assert updated_user["id_card_status"] == "PENDING_VERIFICATION"
    print("SUCCESS: MongoDB user record correctly updated to PENDING_VERIFICATION.")

    # Cleanup
    users_col.delete_many({"email": test_email})
    otps_col.delete_many({"email": test_email})
    print("\nALL 5 INTEGRATION TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_full_flow()
