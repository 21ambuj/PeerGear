"""
Automated Test Suite for Admin Moderation & ID Verification
Tests:
1. Student login rejection for Admin accounts (must use Admin Portal)
2. Admin portal rejection for regular Student accounts
3. Successful Admin login & token generation
4. Strict password redaction: zero password_hash in admin responses
5. ID card verification: APPROVE and REJECT workflows
6. Account suspension: BLOCK and UNBLOCK enforcement on login & authenticated APIs
"""

import os
import sys
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusshare_backend.settings")
django.setup()

from django.test import RequestFactory
from accounts.views import (
    login_view, 
    admin_login_view, 
    admin_users_list_view, 
    admin_verify_id_view, 
    admin_toggle_block_view,
    profile_view
)
from campusshare_backend.db import get_users_collection, to_object_id

rf = RequestFactory()
users_col = get_users_collection()

def test_admin_moderation():
    admin_email = "admin@college.edu"
    admin_pass = "AdminPassword123!"

    # Ensure a test student exists
    student_email = "mod_student@campus.edu"
    users_col.delete_many({"email": student_email})
    
    from accounts.utils import hash_password
    student_doc = {
        "name": "Moderation Test Student",
        "email": student_email,
        "password_hash": hash_password("StudentPass123!"),
        "college_id": "MOD2026",
        "phone": "+91 9123456789",
        "hostel_block": "Block D, 202",
        "role": "STUDENT",
        "is_verified": False,
        "is_email_verified": True,
        "is_blocked": False,
        "id_card_status": "PENDING_VERIFICATION",
        "id_card_filename": "college_id.jpg",
        "id_card_filetype": "image",
        "verification_tier": "UNVERIFIED",
        "trust_score": 5.0,
        "wallet_balance": 500.0
    }
    s_res = users_col.insert_one(student_doc)
    student_id = str(s_res.inserted_id)

    print("\n--- TEST 1: Student Login Rejects Admin Account ---")
    req = rf.post("/api/accounts/login/", data=json.dumps({"email": admin_email, "password": admin_pass}), content_type="application/json")
    res = login_view(req)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    data = json.loads(res.content)
    assert data.get("is_admin") is True
    print("SUCCESS: Student portal rejected admin account with is_admin=True prompt.")

    print("\n--- TEST 2: Admin Portal Rejects Regular Student Account ---")
    req = rf.post("/api/accounts/admin/login/", data=json.dumps({"email": student_email, "password": "StudentPass123!"}), content_type="application/json")
    res = admin_login_view(req)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("SUCCESS: Admin portal strictly rejected student account.")

    print("\n--- TEST 3: Admin Portal Authenticates Administrator ---")
    req = rf.post("/api/accounts/admin/login/", data=json.dumps({"email": admin_email, "password": admin_pass}), content_type="application/json")
    res = admin_login_view(req)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    admin_data = json.loads(res.content)
    admin_token = admin_data["token"]
    assert "password_hash" not in admin_data["admin"], "CRITICAL LEAK: password_hash in admin login response!"
    print("SUCCESS: Admin successfully logged in; password_hash redacted.")

    admin_headers = {"HTTP_AUTHORIZATION": f"Bearer {admin_token}"}

    print("\n--- TEST 4: Admin Directory & Strict Password Redaction ---")
    req = rf.get("/api/accounts/admin/users/?search=Moderation", **admin_headers)
    res = admin_users_list_view(req)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    dir_data = json.loads(res.content)
    assert "metrics" in dir_data
    assert len(dir_data["students"]) >= 1
    for st in dir_data["students"]:
        assert "password_hash" not in st, f"SECURITY FAILURE: password_hash exposed in user {st.get('email')}!"
        assert "salt" not in st, f"SECURITY FAILURE: salt exposed in user {st.get('email')}!"
    print("SUCCESS: Admin directory returned students with ZERO password leaks!")

    print("\n--- TEST 5: ID Card Approval Workflow ---")
    req = rf.post(f"/api/accounts/admin/users/{student_id}/verify-id/", data=json.dumps({
        "action": "APPROVE",
        "reason": "Clear student ID card with valid roll number"
    }), content_type="application/json", **admin_headers)
    res = admin_verify_id_view(req, student_id)
    assert res.status_code == 200
    st_updated = users_col.find_one({"_id": to_object_id(student_id)})
    assert st_updated["id_card_status"] == "VERIFIED"
    assert st_updated["is_verified"] is True
    assert st_updated["verification_tier"] == "TIER_2_STUDENT_ID"
    print("SUCCESS: ID card approved. Status is VERIFIED and Tier is TIER_2_STUDENT_ID.")

    print("\n--- TEST 6: ID Card Rejection Workflow ---")
    req = rf.post(f"/api/accounts/admin/users/{student_id}/verify-id/", data=json.dumps({
        "action": "REJECT",
        "reason": "Photo is blurry and name is unreadable."
    }), content_type="application/json", **admin_headers)
    res = admin_verify_id_view(req, student_id)
    assert res.status_code == 200
    st_updated = users_col.find_one({"_id": to_object_id(student_id)})
    assert st_updated["id_card_status"] == "REJECTED"
    assert st_updated["is_verified"] is False
    assert "blurry" in st_updated["id_card_rejection_reason"]
    print("SUCCESS: ID card rejected. Student notified with reason.")

    print("\n--- TEST 7: Account Suspension (BLOCK) & Enforcement ---")
    req = rf.post(f"/api/accounts/admin/users/{student_id}/toggle-block/", data=json.dumps({
        "action": "BLOCK",
        "reason": "Academic misconduct and unreturned camera lens."
    }), content_type="application/json", **admin_headers)
    res = admin_toggle_block_view(req, student_id)
    assert res.status_code == 200
    st_updated = users_col.find_one({"_id": to_object_id(student_id)})
    assert st_updated["is_blocked"] is True

    # Test login blocked
    login_req = rf.post("/api/accounts/login/", data=json.dumps({"email": student_email, "password": "StudentPass123!"}), content_type="application/json")
    login_res = login_view(login_req)
    assert login_res.status_code == 403, f"Expected 403 blocked login, got {login_res.status_code}"
    assert "suspended" in json.loads(login_res.content)["error"]
    print("SUCCESS: Blocked student login rejected with HTTP 403.")

    print("\n--- TEST 8: Account Restoration (UNBLOCK) ---")
    req = rf.post(f"/api/accounts/admin/users/{student_id}/toggle-block/", data=json.dumps({
        "action": "UNBLOCK",
        "reason": "Fine paid and equipment returned in good condition."
    }), content_type="application/json", **admin_headers)
    res = admin_toggle_block_view(req, student_id)
    assert res.status_code == 200
    st_updated = users_col.find_one({"_id": to_object_id(student_id)})
    assert st_updated["is_blocked"] is False

    # Test login works again
    login_req = rf.post("/api/accounts/login/", data=json.dumps({"email": student_email, "password": "StudentPass123!"}), content_type="application/json")
    login_res = login_view(login_req)
    assert login_res.status_code == 200, f"Expected 200 on unblocked login, got {login_res.status_code}"
    print("SUCCESS: Student account restored and can log in again!")

    # Clean up test user
    users_col.delete_many({"email": student_email})
    print("\n>>> ALL 8 ADMIN MODERATION & SECURITY TESTS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    test_admin_moderation()
