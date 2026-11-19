"""
Accounts Views
Aligned with INT253:
- Unit II: Creating Views and view logic, HTTP requests, Request/Response
- Unit IV: Data validation and HTTP methods
- Unit VI: Managing Users in Django, Authentication logic
"""

import os
import json
import random
import re
from datetime import datetime, timezone, timedelta
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from campusshare_backend.db import (
    get_users_collection, 
    get_wallet_transactions_collection, 
    get_rentals_collection, 
    get_items_collection, 
    get_email_otps_collection,
    get_notifications_collection,
    serialize_doc, 
    to_object_id
)
from accounts.utils import hash_password, verify_password, generate_jwt, get_current_user_from_request, require_auth, require_admin
from accounts.email_service import send_verification_email
from campusshare_backend.security import sanitize_text, safe_str, safe_float
from pymongo.errors import DuplicateKeyError

def issue_or_reuse_otp(email: str, student_name: str = "Student") -> str:
    """
    Issues a 6-digit verification OTP with intelligent deduplication.
    If an unexpired, unused OTP was issued for this email within the last 30 seconds,
    reuses that exact same OTP rather than invalidating it and generating another code.
    This guarantees that duplicate clicks or rapid retries do NOT generate conflicting OTPs.
    """
    otps_col = get_email_otps_collection()
    now = datetime.now(timezone.utc)

    # Check for recent active OTP issued within the last 30 seconds
    recent_otp = otps_col.find_one(
        {
            "email": email,
            "is_used": False,
            "expires_at": {"$gt": now}
        },
        sort=[("created_at", -1)]
    )

    if recent_otp:
        created_at = recent_otp.get("created_at")
        if created_at and hasattr(created_at, "tzinfo") and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        age = (now - created_at).total_seconds() if created_at else 999
        if age < 30:
            # Re-use existing active OTP; send email only if age > 10 to avoid redundant bursts
            if age > 10:
                send_verification_email(email, recent_otp["otp"], student_name)
            return recent_otp["otp"]

    # Invalidate previous unverified OTPs
    otps_col.update_many({"email": email, "is_used": False}, {"$set": {"is_used": True}})

    new_otp = f"{random.randint(100000, 999999)}"
    otps_col.insert_one({
        "email": email,
        "otp": new_otp,
        "expires_at": now + timedelta(minutes=10),
        "attempts": 0,
        "is_used": False,
        "created_at": now
    })

    send_verification_email(email, new_otp, student_name)
    return new_otp

@csrf_exempt
def register_view(request):
    """
    POST /api/accounts/register/
    Registers a new student account, inserts into MongoDB FIRST, and dispatches a verification email.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        if not isinstance(data, dict):
            return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    # Protect against NoSQL operator dictionary injection: reject non-string types
    raw_name = data.get("name")
    raw_email = data.get("email")
    raw_password = data.get("password")
    raw_college_id = data.get("college_id")

    if not isinstance(raw_name, str) or not isinstance(raw_email, str) or not isinstance(raw_password, str) or not isinstance(raw_college_id, str):
        return JsonResponse({"error": "Fields must be valid text strings."}, status=400)

    name = safe_str(raw_name, max_length=100)
    email = safe_str(raw_email, max_length=150).lower()
    password = str(raw_password)
    college_id = safe_str(raw_college_id, max_length=50).upper()
    hostel_block = safe_str(data.get("hostel_block", "Campus Hostel"), max_length=150)
    phone = safe_str(data.get("phone", "+91 0000000000"), max_length=25)

    # Data Validation (INT253 Unit IV)
    if not name or not email or not password or not college_id:
        return JsonResponse({"error": "Name, email, password, and college_id are mandatory fields."}, status=400)

    if "@" not in email or "." not in email.split("@")[-1] or len(email) < 5:
        return JsonResponse({"error": "Please provide a valid personal or university email address."}, status=400)

    if len(password) < 6:
        return JsonResponse({"error": "Password must be at least 6 characters long."}, status=400)

    users_col = get_users_collection()

    # Step 1: Check existing email
    existing_user = users_col.find_one({"email": email})
    if existing_user:
        if existing_user.get("is_email_verified", False):
            return JsonResponse({"error": "An account with this email address is already verified. Please sign in."}, status=400)

        # Check if college_id is in use by another user
        existing_id = users_col.find_one({"college_id": college_id})
        if existing_id and str(existing_id.get("_id")) != str(existing_user.get("_id")):
            return JsonResponse({"error": "This Student Registration ID is already associated with another account."}, status=400)

        # Re-registration for unverified student: update details in MongoDB first
        users_col.update_one(
            {"_id": existing_user["_id"]},
            {
                "$set": {
                    "name": name,
                    "password_hash": hash_password(password),
                    "college_id": college_id,
                    "phone": phone or "+91 0000000000",
                    "hostel_block": hostel_block or "Campus Hostel"
                }
            }
        )

        # Issue or reuse OTP only AFTER MongoDB update succeeds
        issue_or_reuse_otp(email, name)
        return JsonResponse({
            "message": f"Verification code sent! A fresh 6-digit verification code has been dispatched to {email}.",
            "requires_otp": True,
            "is_email_verified": False,
            "email": email
        }, status=200)

    # Step 2: Check if college_id is claimed by another user
    existing_id = users_col.find_one({"college_id": college_id})
    if existing_id:
        return JsonResponse({"error": "An account with this Student Registration ID already exists."}, status=400)

    # Step 3: Insert user into MongoDB FIRST before dispatching any email
    new_user = {
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "college_id": college_id,
        "phone": phone or "+91 0000000000",
        "hostel_block": hostel_block or "Campus Hostel",
        "role": "STUDENT",
        "is_verified": False,
        "is_email_verified": False,
        "id_card_status": "NOT_UPLOADED",
        "id_card_file": None,
        "id_card_filename": None,
        "id_card_filetype": None,
        "verification_tier": "UNVERIFIED",
        "trust_score": 5.0,
        "wallet_balance": 0.0,
        "created_at": datetime.now(timezone.utc)
    }

    try:
        result = users_col.insert_one(new_user)
        new_user["_id"] = result.inserted_id
    except DuplicateKeyError as e:
        if "college_id" in str(e):
            return JsonResponse({"error": "This Student Registration ID is already in use by another account."}, status=400)
        return JsonResponse({"error": "An account with this email address already exists. Please sign in."}, status=400)

    # Step 4: Issue OTP and dispatch email ONLY AFTER successful insert!
    issue_or_reuse_otp(email, name)

    return JsonResponse({
        "message": f"Account details saved! A 6-digit verification code has been sent to {email}.",
        "requires_otp": True,
        "is_email_verified": False,
        "email": email
    }, status=201)

@csrf_exempt
def verify_email_otp_view(request):
    """
    POST /api/accounts/verify-email-otp/
    Verifies 6-digit OTP sent to student's email.
    Upon success, prompts user to upload their Student ID Card.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        email = safe_str(data.get("email", "")).strip().lower()
        # Clean OTP: extract digits only to handle any formatting, spaces, or pasted text
        otp_entered = "".join(filter(str.isdigit, str(data.get("otp", ""))))
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    if not email or not otp_entered:
        return JsonResponse({"error": "Email and 6-digit verification code are required."}, status=400)

    if len(otp_entered) != 6:
        return JsonResponse({"error": "Please enter a valid 6-digit verification code."}, status=400)

    otps_col = get_email_otps_collection()
    users_col = get_users_collection()

    user = users_col.find_one({"email": email})
    if not user:
        return JsonResponse({"error": "Student account not found with this email."}, status=404)

    # Find latest active OTP record
    otp_record = otps_col.find_one(
        {"email": email, "is_used": False},
        sort=[("created_at", -1)]
    )

    if not otp_record:
        return JsonResponse({"error": "No active verification code found. Please click 'Resend Code'."}, status=400)

    # Robust expiration comparison
    now_ts = datetime.now(timezone.utc).timestamp()
    exp = otp_record.get("expires_at")
    exp_ts = 0
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        exp_ts = exp.timestamp()

    if exp_ts and now_ts > exp_ts:
        return JsonResponse({"error": "Verification code has expired. Please click 'Resend Code'."}, status=400)

    if otp_record.get("attempts", 0) >= 5:
        return JsonResponse({"error": "Too many failed attempts. Please click 'Resend Code' to receive a new one."}, status=400)

    expected_otp = "".join(filter(str.isdigit, str(otp_record.get("otp", ""))))
    if otp_entered != expected_otp:
        otps_col.update_one({"_id": otp_record["_id"]}, {"$inc": {"attempts": 1}})
        attempts_used = otp_record.get("attempts", 0) + 1
        remaining = max(0, 5 - attempts_used)
        return JsonResponse({
            "error": f"Invalid verification code. {remaining} attempt(s) remaining. Make sure you enter the latest code sent to {email}."
        }, status=400)

    # Mark OTP as used
    otps_col.update_one({"_id": otp_record["_id"]}, {"$set": {"is_used": True}})

    # Update student record to email verified
    users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_email_verified": True,
                "verification_tier": "EMAIL_VERIFIED"
            }
        }
    )

    updated_user = users_col.find_one({"_id": user["_id"]})
    token = generate_jwt(updated_user)
    return JsonResponse({
        "message": "Email verified successfully! Please upload your Student ID Card (Photo or PDF) to complete verification.",
        "token": token,
        "is_email_verified": True,
        "next_step": "UPLOAD_ID_CARD",
        "user": serialize_doc(updated_user)
    }, status=200)

@csrf_exempt
def resend_email_otp_view(request):
    """
    POST /api/accounts/resend-email-otp/
    Generates and dispatches a fresh 6-digit OTP to student's email.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        email = safe_str(data.get("email", "")).strip().lower()
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    if not email:
        return JsonResponse({"error": "Email is required."}, status=400)

    users_col = get_users_collection()
    otps_col = get_email_otps_collection()

    user = users_col.find_one({"email": email})
    if not user:
        return JsonResponse({"error": "Account not found."}, status=404)

    # Invalidate previous OTPs
    otps_col.update_many({"email": email, "is_used": False}, {"$set": {"is_used": True}})

    new_otp = f"{random.randint(100000, 999999)}"
    otps_col.insert_one({
        "email": email,
        "otp": new_otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
        "attempts": 0,
        "is_used": False,
        "created_at": datetime.now(timezone.utc)
    })

    send_verification_email(email, new_otp, user.get("name", "Student"))
    return JsonResponse({"message": f"A fresh verification code has been sent to {email}."}, status=200)

@csrf_exempt
def upload_id_card_view(request):
    """
    POST /api/accounts/upload-id-card/
    Uploads College ID Card (picture or PDF format).
    Updates user status to PENDING_VERIFICATION and allows user to proceed directly to Home page.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required to upload ID card."}, status=401)

    file_url = None
    original_filename = "student_id"
    file_type = "image"

    # Check for multipart/form-data upload
    if request.FILES and "id_card" in request.FILES:
        uploaded_file = request.FILES["id_card"]
        original_filename = uploaded_file.name
        ext = os.path.splitext(uploaded_file.name)[1].lower()

        allowed_exts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"]
        if ext not in allowed_exts:
            return JsonResponse({"error": f"Invalid file format '{ext}'. Only JPG, PNG, WEBP, or PDF files are accepted."}, status=400)

        # File size check (max 10MB)
        if uploaded_file.size > 10 * 1024 * 1024:
            return JsonResponse({"error": "File size exceeds 10MB limit."}, status=400)

        file_type = "pdf" if ext == ".pdf" else "image"

        # Save to media/id_cards/
        id_cards_dir = os.path.join(settings.MEDIA_ROOT, "id_cards")
        os.makedirs(id_cards_dir, exist_ok=True)
        safe_fname = f"id_{user['_id']}_{int(datetime.now(timezone.utc).timestamp())}{ext}"
        save_path = os.path.join(id_cards_dir, safe_fname)
        with open(save_path, "wb+") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        rel_url = f"{settings.MEDIA_URL}id_cards/{safe_fname}"
        file_url = request.build_absolute_uri(rel_url)

    else:
        # Check for JSON payload with Base64 Data URL
        try:
            data = json.loads(request.body.decode("utf-8"))
            id_data = data.get("id_card_data", "")
            original_filename = safe_str(data.get("filename", "student_id"))
        except Exception:
            return JsonResponse({"error": "No file uploaded or invalid JSON body."}, status=400)

        if not id_data:
            return JsonResponse({"error": "Please select a photo or PDF of your college ID card."}, status=400)

        if id_data.startswith("data:application/pdf"):
            file_type = "pdf"
            file_url = id_data
        elif id_data.startswith("data:image/"):
            file_type = "image"
            file_url = id_data
        elif id_data.startswith("http"):
            file_url = id_data
        else:
            return JsonResponse({"error": "Invalid ID card data. Must be an image or PDF."}, status=400)

    users_col = get_users_collection()
    users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "id_card_file": file_url,
                "id_card_filename": original_filename,
                "id_card_filetype": file_type,
                "id_card_status": "PENDING_VERIFICATION",
                "id_card_uploaded_at": datetime.now(timezone.utc),
                "is_verified": True, # Active student on campus platform
                "verification_status_message": "College ID submitted. Our campus moderation team will verify your credentials soon."
            }
        }
    )

    updated_user = users_col.find_one({"_id": user["_id"]})
    return JsonResponse({
        "message": "College ID submitted successfully! Our campus moderation team will verify your credentials soon.",
        "user": serialize_doc(updated_user),
        "redirect_to": "/"
    }, status=200)

@csrf_exempt
def login_view(request):
    """
    POST /api/accounts/login/
    Student and Admin login endpoint with NoSQL injection prevention and salted verification.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        if not isinstance(data, dict):
            return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    raw_email = data.get("email")
    raw_password = data.get("password")

    # Guard against NoSQL injection: operator objects rejected
    if not isinstance(raw_email, str) or not isinstance(raw_password, str):
        return JsonResponse({"error": "Invalid email or password format."}, status=400)

    email = str(raw_email).strip().lower()
    password = str(raw_password)

    if not email or not password:
        return JsonResponse({"error": "Email and password are required."}, status=400)

    users_col = get_users_collection()
    user = users_col.find_one({"email": email})

    if not user or not verify_password(password, user.get("password_hash")):
        return JsonResponse({"error": "Invalid college email or password."}, status=401)

    # Transparently upgrade legacy unsalted hashes to modern salted hash
    current_salted = hash_password(password)
    if user.get("password_hash") != current_salted:
        users_col.update_one({"_id": user["_id"]}, {"$set": {"password_hash": current_salted}})
        user["password_hash"] = current_salted

    # Check if student account has been suspended by campus administration
    if user.get("is_blocked", False):
        reason = user.get("blocked_reason") or "Violation of campus community safety guidelines"
        return JsonResponse({
            "error": f"Your account has been suspended by campus administration. Reason: {reason}",
            "is_blocked": True
        }, status=403)

    # Route administrative accounts to the dedicated Admin Portal
    if user.get("role") == "ADMIN":
        return JsonResponse({
            "error": "Administrative account detected. Please use the dedicated Campus Admin Portal to sign in.",
            "is_admin": True
        }, status=403)

    # Enforce strict OTP verification: reject unverified student accounts
    if not user.get("is_email_verified", False):
        issue_or_reuse_otp(email, user.get("name", "Student"))
        return JsonResponse({
            "error": f"Email verification required. A 6-digit verification code has been dispatched to {email}.",
            "requires_otp": True,
            "is_email_verified": False,
            "email": email
        }, status=403)

    token = generate_jwt(user)
    return JsonResponse({
        "message": "Login successful!",
        "token": token,
        "user": serialize_doc(user)
    }, status=200)

@csrf_exempt
def profile_view(request):
    """
    GET /api/accounts/profile/
    PUT /api/accounts/profile/
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Unauthorized. Please login."}, status=401)

    if not user.get("is_email_verified", False):
        return JsonResponse({
            "error": "Account email is not verified. Please complete OTP verification.",
            "requires_otp": True
        }, status=403)

    users_col = get_users_collection()

    if request.method == "GET":
        return JsonResponse({"user": serialize_doc(user)}, status=200)

    elif request.method == "PUT":
        try:
            data = json.loads(request.body.decode("utf-8"))
            if not isinstance(data, dict):
                return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        update_fields = {}
        for field in ["name", "phone", "hostel_block"]:
            if field in data and data[field] is not None:
                val = safe_str(data[field], max_length=150)
                if val:
                    update_fields[field] = val

        if update_fields:
            users_col.update_one({"_id": user["_id"]}, {"$set": update_fields})
            user = users_col.find_one({"_id": user["_id"]})

        return JsonResponse({
            "message": "Profile updated successfully!",
            "user": serialize_doc(user)
        }, status=200)

    return JsonResponse({"error": "Method not allowed."}, status=405)

@csrf_exempt
def wallet_view(request):
    """
    GET /api/accounts/wallet/ -> returns current wallet balance
    POST /api/accounts/wallet/ -> add funds to wallet with integer/overflow limits
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Unauthorized. Please login."}, status=401)

    users_col = get_users_collection()

    if request.method == "GET":
        return JsonResponse({
            "wallet_balance": user.get("wallet_balance", 0.0),
            "trust_score": user.get("trust_score", 5.0)
        }, status=200)

    elif request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            raw_amount = data.get("amount") if isinstance(data, dict) else None
        except Exception:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        amount = safe_float(raw_amount, default=-1.0)
        if amount <= 0:
            return JsonResponse({"error": "Deposit top-up amount must be a valid positive number."}, status=400)

        if amount > 50000.0:
            return JsonResponse({"error": "Deposit top-up cannot exceed ₹50,000 per transaction for safety."}, status=400)

        amount = round(amount, 2)
        users_col.update_one({"_id": user["_id"]}, {"$inc": {"wallet_balance": amount}})
        updated_user = users_col.find_one({"_id": user["_id"]})

        # Record topup transaction in wallet_transactions & notify student
        try:
            get_wallet_transactions_collection().insert_one({
                "user_id": user["_id"],
                "type": "TOPUP",
                "amount": amount,
                "description": "Campus Escrow Wallet Recharge",
                "balance_after": updated_user.get("wallet_balance", 0.0),
                "status": "SUCCESS",
                "created_at": datetime.now(timezone.utc)
            })
            get_notifications_collection().insert_one({
                "recipient_id": user["_id"],
                "type": "WALLET_TOPUP",
                "title": "Wallet Recharged 💳",
                "message": f"₹{amount:.2f} successfully credited to your campus escrow wallet.",
                "is_read": False,
                "created_at": datetime.now(timezone.utc)
            })
        except Exception:
            pass

        return JsonResponse({
            "message": f"Successfully added ₹{amount:.2f} to your campus wallet.",
            "wallet_balance": updated_user.get("wallet_balance", 0.0)
        }, status=200)

    return JsonResponse({"error": "Method not allowed."}, status=405)

@csrf_exempt
def wallet_history_view(request):
    """
    GET /api/accounts/wallet-history/
    Returns full ledger of wallet transactions: top-ups, deposit refunds, rental debits, and earnings.
    Synthesizes from wallet_transactions collection and rentals collection for complete historical audit.
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Unauthorized. Please login."}, status=401)

    user_id = user["_id"]
    wallet_tx_col = get_wallet_transactions_collection()
    rentals_col = get_rentals_collection()
    items_col = get_items_collection()

    transactions = list(wallet_tx_col.find({"user_id": user_id}).sort("created_at", -1))

    # Also resolve all rentals associated with this user to ensure 100% complete audit trail
    rentals = list(rentals_col.find({"$or": [{"renter_id": user_id}, {"owner_id": user_id}]}).sort("created_at", -1))
    
    # Map item titles
    item_ids = list(set([r["item_id"] for r in rentals if "item_id" in r]))
    items_map = {item["_id"]: item for item in items_col.find({"_id": {"$in": item_ids}})}

    # Track rental transaction IDs already recorded
    recorded_rental_ids = set()
    for tx in transactions:
        if "rental_id" in tx:
            recorded_rental_ids.add(str(tx["rental_id"]))

    for r in rentals:
        r_id = str(r["_id"])
        item = items_map.get(r.get("item_id"), {})
        item_title = item.get("title", "Campus Resource")
        created_time = r.get("created_at") or datetime.now(timezone.utc)

        # 1. If user is renter, check rental debit and deposit refund
        if str(r.get("renter_id")) == str(user_id):
            if f"{r_id}_debit" not in recorded_rental_ids and r_id not in recorded_rental_ids:
                total_paid = float(r.get("total_paid", 0.0) or (r.get("rental_fee", 0.0) + r.get("security_deposit", 0.0)))
                transactions.append({
                    "_id": f"tx_{r_id}_debit",
                    "user_id": user_id,
                    "rental_id": r["_id"],
                    "type": "RENTAL_DEBIT",
                    "amount": -total_paid,
                    "rental_fee": r.get("rental_fee", 0.0),
                    "security_deposit": r.get("security_deposit", 0.0),
                    "item_title": item_title,
                    "description": f"Reserved '{item_title}' (Fee: ₹{r.get('rental_fee', 0.0)} + Deposit: ₹{r.get('security_deposit', 0.0)})",
                    "status": "COMPLETED",
                    "created_at": created_time
                })

            if r.get("deposit_status") == "REFUNDED":
                if f"{r_id}_refund" not in recorded_rental_ids:
                    sec_dep = float(r.get("security_deposit", 0.0))
                    transactions.append({
                        "_id": f"tx_{r_id}_refund",
                        "user_id": user_id,
                        "rental_id": r["_id"],
                        "type": "ESCROW_REFUND",
                        "amount": sec_dep,
                        "item_title": item_title,
                        "description": f"100% Security Deposit Refund for '{item_title}'",
                        "status": "REFUNDED",
                        "created_at": r.get("condition_tracking", {}).get("return_verification", {}).get("verified_at") or created_time
                    })

        # 2. If user is owner and rental was completed or active, record earnings
        if str(r.get("owner_id")) == str(user_id):
            if f"{r_id}_earning" not in recorded_rental_ids:
                fee = float(r.get("rental_fee", 0.0))
                if fee > 0:
                    transactions.append({
                        "_id": f"tx_{r_id}_earning",
                        "user_id": user_id,
                        "rental_id": r["_id"],
                        "type": "RENTAL_EARNING",
                        "amount": fee,
                        "item_title": item_title,
                        "description": f"Rental Earnings from '{item_title}'",
                        "status": "CREDITED",
                        "created_at": created_time
                    })

    # Sort all transactions by created_at descending
    def get_sort_key(tx):
        dt = tx.get("created_at")
        if isinstance(dt, datetime):
            return dt.timestamp()
        return 0

    transactions.sort(key=get_sort_key, reverse=True)

    # Compute financial summary
    total_topup = sum(tx["amount"] for tx in transactions if tx.get("type") == "TOPUP" and tx.get("amount", 0) > 0)
    total_refunded = sum(tx["amount"] for tx in transactions if tx.get("type") == "ESCROW_REFUND" and tx.get("amount", 0) > 0)
    total_spent = sum(abs(tx["amount"]) for tx in transactions if tx.get("type") == "RENTAL_DEBIT")
    total_earned = sum(tx["amount"] for tx in transactions if tx.get("type") == "RENTAL_EARNING")

    return JsonResponse({
        "transactions": serialize_doc(transactions),
        "summary": {
            "wallet_balance": user.get("wallet_balance", 0.0),
            "total_topup": total_topup,
            "total_refunded": total_refunded,
            "total_spent_rentals": total_spent,
            "total_earned_lending": total_earned
        }
    }, status=200)

def students_list_view(request):
    """
    GET /api/accounts/students/
    Provides list of active student accounts for quick role-switching in demos.
    """
    users_col = get_users_collection()
    students = list(users_col.find({}, {"password_hash": 0}))
    return JsonResponse({"students": serialize_doc(students)}, status=200)

@csrf_exempt
def admin_login_view(request):
    """
    POST /api/accounts/admin/login/
    Dedicated administrative portal authentication.
    Strictly verifies credentials and enforces role == 'ADMIN'.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))
        if not isinstance(data, dict):
            return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    raw_email = data.get("email")
    raw_password = data.get("password")

    if not isinstance(raw_email, str) or not isinstance(raw_password, str):
        return JsonResponse({"error": "Invalid email or password format."}, status=400)

    email = str(raw_email).strip().lower()
    password = str(raw_password)

    if not email or not password:
        return JsonResponse({"error": "Admin email and password are required."}, status=400)

    users_col = get_users_collection()
    user = users_col.find_one({"email": email})

    if not user or not verify_password(password, user.get("password_hash")):
        return JsonResponse({"error": "Invalid administrator credentials."}, status=401)

    if user.get("role") != "ADMIN":
        return JsonResponse({"error": "Access denied. Administrator privileges required to access this portal."}, status=403)

    if user.get("is_blocked", False):
        return JsonResponse({"error": "Administrative account has been suspended."}, status=403)

    token = generate_jwt(user)
    # Strictly redact password hash and internal salts
    safe_admin = serialize_doc(user)
    safe_admin.pop("password_hash", None)
    safe_admin.pop("salt", None)

    return JsonResponse({
        "message": "Administrator authentication successful!",
        "token": token,
        "admin": safe_admin
    }, status=200)

@csrf_exempt
@require_admin
def admin_users_list_view(request):
    """
    GET /api/accounts/admin/users/
    Admin Directory: returns list of students with metrics.
    STRICT SECURITY: Redacts password_hash and internal salts.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed. Use GET."}, status=405)

    users_col = get_users_collection()
    
    # Query parameters
    search = safe_str(request.GET.get("search", "")).strip()
    id_status = safe_str(request.GET.get("id_status", "ALL")).strip().upper()
    account_status = safe_str(request.GET.get("account_status", "ALL")).strip().upper()

    # Metric counts across entire student directory
    total_students = users_col.count_documents({"role": "STUDENT"})
    pending_verifications = users_col.count_documents({"role": "STUDENT", "id_card_status": "PENDING_VERIFICATION"})
    verified_students = users_col.count_documents({"role": "STUDENT", "id_card_status": "VERIFIED"})
    blocked_accounts = users_col.count_documents({"role": "STUDENT", "is_blocked": True})

    query = {"role": "STUDENT"}

    if search:
        escaped_search = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": escaped_search, "$options": "i"}},
            {"email": {"$regex": escaped_search, "$options": "i"}},
            {"college_id": {"$regex": escaped_search, "$options": "i"}},
            {"hostel_block": {"$regex": escaped_search, "$options": "i"}}
        ]

    if id_status and id_status != "ALL":
        query["id_card_status"] = id_status

    if account_status == "BLOCKED":
        query["is_blocked"] = True
    elif account_status == "ACTIVE":
        query["is_blocked"] = {"$ne": True}

    # Explicit projection: Redact password_hash and internal salts
    projection = {"password_hash": 0, "salt": 0}
    students = list(users_col.find(query, projection).sort("created_at", -1))

    # Ensure id_card_file has full accessible URL for frontend
    for st in students:
        id_file = st.get("id_card_file")
        if id_file and isinstance(id_file, str) and id_file.startswith("/media/"):
            st["id_card_file"] = request.build_absolute_uri(id_file)

    return JsonResponse({
        "metrics": {
            "total_students": total_students,
            "pending_verifications": pending_verifications,
            "verified_students": verified_students,
            "blocked_accounts": blocked_accounts
        },
        "students": serialize_doc(students)
    }, status=200)

@csrf_exempt
@require_admin
def admin_verify_id_view(request, user_id):
    """
    POST /api/accounts/admin/users/<user_id>/verify-id/
    Approves or Rejects a student's uploaded ID card.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    oid = to_object_id(user_id)
    if not oid:
        return JsonResponse({"error": "Invalid user ID."}, status=400)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    action = safe_str(data.get("action", "")).strip().upper()
    reason = safe_str(data.get("reason", "")).strip()

    if action not in ["APPROVE", "REJECT"]:
        return JsonResponse({"error": "Action must be APPROVE or REJECT."}, status=400)

    if action == "REJECT" and not reason:
        return JsonResponse({"error": "A rejection reason is required to notify the student."}, status=400)

    users_col = get_users_collection()
    student = users_col.find_one({"_id": oid, "role": "STUDENT"})
    if not student:
        return JsonResponse({"error": "Student account not found."}, status=404)

    admin_name = request.user_doc.get("name", "Campus Moderation")
    notifs_col = get_notifications_collection()
    now = datetime.now(timezone.utc)

    if action == "APPROVE":
        users_col.update_one(
            {"_id": oid},
            {
                "$set": {
                    "id_card_status": "VERIFIED",
                    "is_verified": True,
                    "verification_tier": "TIER_2_STUDENT_ID",
                    "id_card_reviewed_at": now,
                    "id_card_reviewed_by": admin_name,
                    "id_card_rejection_reason": None,
                    "verification_status_message": "College ID verified by campus administration."
                }
            }
        )
        notifs_col.insert_one({
            "recipient_id": oid,
            "type": "ID_VERIFIED",
            "title": "Student ID Verified! 🎉",
            "message": f"Your college ID card has been verified by {admin_name}. You now have full campus exchange and rental privileges.",
            "is_read": False,
            "created_at": now
        })
        msg = f"College ID for {student.get('name')} approved successfully."
    else:
        users_col.update_one(
            {"_id": oid},
            {
                "$set": {
                    "id_card_status": "REJECTED",
                    "is_verified": False,
                    "verification_tier": "UNVERIFIED",
                    "id_card_reviewed_at": now,
                    "id_card_reviewed_by": admin_name,
                    "id_card_rejection_reason": reason,
                    "verification_status_message": f"ID Card rejected: {reason}"
                }
            }
        )
        notifs_col.insert_one({
            "recipient_id": oid,
            "type": "ID_REJECTED",
            "title": "College ID Verification Issue",
            "message": f"Your submitted college ID card could not be verified. Reason: {reason}. Please upload a clearer photo or official fee slip.",
            "is_read": False,
            "created_at": now
        })
        msg = f"College ID for {student.get('name')} marked as rejected."

    updated_student = users_col.find_one({"_id": oid}, {"password_hash": 0, "salt": 0})
    return JsonResponse({"message": msg, "student": serialize_doc(updated_student)}, status=200)

@csrf_exempt
@require_admin
def admin_toggle_block_view(request, user_id):
    """
    POST /api/accounts/admin/users/<user_id>/toggle-block/
    Suspends (blocks) or Restores (unblocks) a student account.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    oid = to_object_id(user_id)
    if not oid:
        return JsonResponse({"error": "Invalid user ID."}, status=400)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    action = safe_str(data.get("action", "")).strip().upper()
    reason = safe_str(data.get("reason", "")).strip()

    if action not in ["BLOCK", "UNBLOCK"]:
        return JsonResponse({"error": "Action must be BLOCK or UNBLOCK."}, status=400)

    users_col = get_users_collection()
    student = users_col.find_one({"_id": oid})
    if not student:
        return JsonResponse({"error": "User account not found."}, status=404)

    if student.get("role") == "ADMIN":
        return JsonResponse({"error": "Administrator accounts cannot be blocked."}, status=400)

    admin_name = request.user_doc.get("name", "Campus Moderation")
    notifs_col = get_notifications_collection()
    now = datetime.now(timezone.utc)

    if action == "BLOCK":
        block_reason = reason or "Administrative suspension due to campus policy violation."
        users_col.update_one(
            {"_id": oid},
            {
                "$set": {
                    "is_blocked": True,
                    "blocked_reason": block_reason,
                    "blocked_at": now,
                    "blocked_by": admin_name
                }
            }
        )
        notifs_col.insert_one({
            "recipient_id": oid,
            "type": "ACCOUNT_BLOCKED",
            "title": "Account Suspended",
            "message": f"Your PeerGear account has been suspended by campus administration. Reason: {block_reason}",
            "is_read": False,
            "created_at": now
        })
        msg = f"Student account for {student.get('name')} has been suspended."
    else:
        users_col.update_one(
            {"_id": oid},
            {
                "$set": {
                    "is_blocked": False,
                    "unblocked_at": now,
                    "unblocked_by": admin_name
                },
                "$unset": {
                    "blocked_reason": "",
                    "blocked_at": "",
                    "blocked_by": ""
                }
            }
        )
        notifs_col.insert_one({
            "recipient_id": oid,
            "type": "ACCOUNT_UNBLOCKED",
            "title": "Account Restored",
            "message": "Your PeerGear account suspension has been lifted. You can now access campus resources.",
            "is_read": False,
            "created_at": now
        })
        msg = f"Student account for {student.get('name')} has been restored."

    updated_student = users_col.find_one({"_id": oid}, {"password_hash": 0, "salt": 0})
    return JsonResponse({"message": msg, "student": serialize_doc(updated_student)}, status=200)
