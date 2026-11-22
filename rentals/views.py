"""
Rentals App Views
Aligned with:
- CSE494:
  - Unit II: CRUD Operations, BSON Data Types
  - Unit III: Embedding vs Referencing (embedded condition_tracking before & after photos, referenced item & users)
- INT253:
  - Unit II: View logic, HTTP methods, error handling
  - Unit IV: Form & transaction data validation
  - Unit VI: Authenticated user management & security
"""

import json
import random
from datetime import datetime, timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from campusshare_backend.db import (
    get_rentals_collection,
    get_items_collection,
    get_users_collection,
    get_disputes_collection,
    get_notifications_collection,
    get_wallet_transactions_collection,
    serialize_doc,
    to_object_id
)
from accounts.utils import (
    get_current_user_from_request,
    check_user_blocked,
    check_user_id_verified
)
from campusshare_backend.security import sanitize_text, safe_str, safe_float, sanitize_image_list

@csrf_exempt
def create_rental_booking(request):
    """
    POST /api/rentals/book/
    Creates a new rental contract with refundable security deposit.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required to book an item."}, status=401)

    # Enforce account suspension check
    blocked_err = check_user_blocked(user)
    if blocked_err:
        return blocked_err

    # Enforce Student ID Card verification check
    id_err = check_user_id_verified(user, "rent equipment on PeerGear")
    if id_err:
        return id_err

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    item_id = to_object_id(data.get("item_id"))
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    notes = data.get("notes", "").strip()

    if not item_id or not start_date_str or not end_date_str:
        return JsonResponse({"error": "Item ID, start date, and end date are required."}, status=400)

    items_col = get_items_collection()
    users_col = get_users_collection()
    rentals_col = get_rentals_collection()
    notifs_col = get_notifications_collection()

    item = items_col.find_one({"_id": item_id})
    if not item:
        return JsonResponse({"error": "Item not found."}, status=404)

    if item.get("availability_status") != "AVAILABLE":
        return JsonResponse({"error": f"Item is currently {item.get('availability_status')}, not available for booking."}, status=400)

    # Prevent owner renting their own item
    if str(item.get("owner_id")) == str(user["_id"]):
        return JsonResponse({"error": "You cannot rent your own item."}, status=400)

    try:
        start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
        end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
    except Exception:
        return JsonResponse({"error": "Dates must be valid ISO format (YYYY-MM-DD)."}, status=400)

    if end_date < start_date:
        return JsonResponse({"error": "End date cannot be earlier than start date."}, status=400)

    days_diff = (end_date - start_date).days
    rental_days = max(1, days_diff)

    rate_per_day = float(item.get("rental_rate_per_day", 0))
    security_deposit = float(item.get("security_deposit", 0))
    rental_fee = round(rate_per_day * rental_days, 2)
    total_payable = round(rental_fee + security_deposit, 2)

    # Check student wallet balance
    user_balance = float(user.get("wallet_balance", 0))
    if user_balance < total_payable:
        shortfall = total_payable - user_balance
        return JsonResponse({
            "error": f"Insufficient wallet balance. Total required is ₹{total_payable:.2f} (Rent: ₹{rental_fee:.2f} + Deposit: ₹{security_deposit:.2f}). Please top up ₹{shortfall:.2f}.",
            "shortfall": shortfall,
            "wallet_balance": user_balance,
            "total_payable": total_payable
        }, status=400)

    # Deduct total_payable from renter wallet
    users_col.update_one({"_id": user["_id"]}, {"$inc": {"wallet_balance": -total_payable}})

    # Generate random 4-digit handover OTP
    handover_otp = str(random.randint(1000, 9999))

    # Create rental document with embedded condition tracking (CSE494 Unit III)
    new_rental = {
        "item_id": item["_id"],
        "owner_id": item["owner_id"],
        "renter_id": user["_id"],
        "start_date": start_date,
        "end_date": end_date,
        "rental_days": rental_days,
        "rental_fee": rental_fee,
        "security_deposit": security_deposit,
        "total_paid": total_payable,
        "status": "BOOKED",
        "deposit_status": "HELD",
        "handover_otp": handover_otp,
        "condition_tracking": {
            "pickup_verification": {
                "verified_at": None,
                "photos": [],
                "notes": notes or "Item reserved by student",
                "otp_verified": False
            },
            "return_verification": {
                "verified_at": None,
                "photos": [],
                "notes": "",
                "damage_reported": False
            }
        },
        "refunded_deposit_amount": 0.0,
        "created_at": datetime.now(timezone.utc)
    }

    result = rentals_col.insert_one(new_rental)
    new_rental["_id"] = result.inserted_id

    # Update item status to RESERVED / RENTED
    items_col.update_one({"_id": item["_id"]}, {"$set": {"availability_status": "RENTED"}})

    # Notify Owner
    notifs_col.insert_one({
        "recipient_id": item["owner_id"],
        "type": "NEW_BOOKING",
        "title": "New Rental Booking!",
        "message": f"{user.get('name')} booked '{item.get('title')}' from {start_date.strftime('%d %b')} to {end_date.strftime('%d %b')}. Security deposit of ₹{security_deposit:.2f} held.",
        "rental_id": new_rental["_id"],
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    })

    # Record wallet transaction
    try:
        get_wallet_transactions_collection().insert_one({
            "user_id": user["_id"],
            "rental_id": new_rental["_id"],
            "type": "RENTAL_DEBIT",
            "amount": -total_payable,
            "rental_fee": rental_fee,
            "security_deposit": security_deposit,
            "item_title": item.get("title"),
            "description": f"Reserved '{item.get('title')}' (Fee: ₹{rental_fee} + Deposit: ₹{security_deposit})",
            "status": "COMPLETED",
            "created_at": datetime.now(timezone.utc)
        })
    except Exception:
        pass

    return JsonResponse({
        "message": "Booking confirmed! Security deposit held in escrow.",
        "rental": serialize_doc(new_rental),
        "handover_otp": handover_otp
    }, status=201)

@csrf_exempt
def my_rentals_view(request):
    """
    GET /api/rentals/my-rentals/
    Returns active and historical rentals for the logged-in student (both as renter and owner).
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    blocked_err = check_user_blocked(user)
    if blocked_err:
        return blocked_err

    rentals_col = get_rentals_collection()
    items_col = get_items_collection()
    users_col = get_users_collection()

    user_id = user["_id"]
    role_filter = request.GET.get("role", "all")  # 'renter', 'owner', or 'all'

    query = {}
    if role_filter == "renter":
        query["renter_id"] = user_id
    elif role_filter == "owner":
        query["owner_id"] = user_id
    else:
        query["$or"] = [{"renter_id": user_id}, {"owner_id": user_id}]

    rentals_list = list(rentals_col.find(query).sort("created_at", -1))

    # Resolve references (CSE494 Unit III: Referencing joins)
    item_ids = list(set([r["item_id"] for r in rentals_list if "item_id" in r]))
    user_ids = list(set([r["owner_id"] for r in rentals_list] + [r["renter_id"] for r in rentals_list]))

    items_map = {item["_id"]: item for item in items_col.find({"_id": {"$in": item_ids}})}
    users_map = {u["_id"]: u for u in users_col.find({"_id": {"$in": user_ids}})}

    for r in rentals_list:
        item = items_map.get(r.get("item_id"))
        if item:
            r["item"] = {
                "id": str(item["_id"]),
                "title": item.get("title"),
                "category": item.get("category"),
                "image": item.get("images", [""])[0] if item.get("images") else "",
                "pickup_location": item.get("pickup_location") or "Campus Main Hub"
            }
            r["pickup_location"] = item.get("pickup_location") or "Campus Main Hub"
        
        owner = users_map.get(r.get("owner_id"))
        if owner:
            r["owner"] = {
                "id": str(owner["_id"]),
                "name": owner.get("name"),
                "phone": owner.get("phone"),
                "email": owner.get("email"),
                "college_id": owner.get("college_id", "CAMPUS-STUDENT"),
                "hostel_block": owner.get("hostel_block", "Campus Residence"),
                "trust_score": owner.get("trust_score", 5.0),
                "is_verified": bool(owner.get("is_verified", False)),
                "is_email_verified": bool(owner.get("is_email_verified", False)),
                "verification_tier": owner.get("verification_tier", "UNVERIFIED"),
                "id_card_status": owner.get("id_card_status", "NOT_UPLOADED")
            }

        renter = users_map.get(r.get("renter_id"))
        if renter:
            r["renter"] = {
                "id": str(renter["_id"]),
                "name": renter.get("name"),
                "phone": renter.get("phone"),
                "email": renter.get("email"),
                "college_id": renter.get("college_id", "CAMPUS-STUDENT"),
                "hostel_block": renter.get("hostel_block", "Campus Residence"),
                "trust_score": renter.get("trust_score", 5.0),
                "is_verified": bool(renter.get("is_verified", False)),
                "is_email_verified": bool(renter.get("is_email_verified", False)),
                "verification_tier": renter.get("verification_tier", "UNVERIFIED"),
                "id_card_status": renter.get("id_card_status", "NOT_UPLOADED")
            }

        # Real-world security protection:
        # Only the legitimate renter possesses the secret handover OTP / QR pass before meetup.
        # The owner must not see the secret OTP until physical handover verification.
        if str(r.get("owner_id")) == str(user_id) and str(r.get("renter_id")) != str(user_id) and r.get("status") == "BOOKED":
            r["handover_otp"] = None

    return JsonResponse({"rentals": serialize_doc(rentals_list)}, status=200)

@csrf_exempt
def pickup_verification_view(request, rental_id):
    """
    POST /api/rentals/<rental_id>/verify-pickup/
    Records initial condition photos and verifies handover OTP.
    Enforces strict BOLA/IDOR check: only the item owner can verify pickup.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    blocked_err = check_user_blocked(user)
    if blocked_err:
        return blocked_err

    obj_id = to_object_id(rental_id)
    rentals_col = get_rentals_collection()
    rental = rentals_col.find_one({"_id": obj_id})
    if not rental:
        return JsonResponse({"error": "Rental not found."}, status=404)

    # Authorization check (BOLA / IDOR defense): Only owner or ADMIN can verify handover
    if str(rental.get("owner_id")) != str(user["_id"]) and user.get("role") != "ADMIN":
        return JsonResponse({"error": "Unauthorized: Only the item owner can verify handover and pickup."}, status=403)

    # Rental state check
    if rental.get("status") != "BOOKED":
        return JsonResponse({"error": f"Cannot verify pickup: Rental is currently '{rental.get('status')}'.' (Expected 'BOOKED')"}, status=400)

    try:
        data = json.loads(request.body.decode("utf-8"))
        if not isinstance(data, dict):
            return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    otp_entered = str(data.get("otp", "")).strip()
    notes = safe_str(data.get("notes", ""), max_length=500)
    photos = sanitize_image_list(
        data.get("photos", []),
        max_count=5,
        default_fallback="https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80"
    )

    # Verify Handover OTP
    if otp_entered != str(rental.get("handover_otp")):
        return JsonResponse({"error": "Invalid Handover OTP. Please ask the renter for the 4-digit code."}, status=400)

    # Embedded condition tracking update (Unit III)
    rentals_col.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "ACTIVE",
                "condition_tracking.pickup_verification": {
                    "verified_at": datetime.now(timezone.utc),
                    "photos": photos,
                    "notes": notes or "Item picked up in inspected working condition.",
                    "otp_verified": True
                }
            }
        }
    )

    # Notify Renter that Handover was verified and item is active
    try:
        items_col = get_items_collection()
        item_doc = items_col.find_one({"_id": rental["item_id"]})
        item_title = item_doc.get("title", "Resource") if item_doc else "Resource"
        notifs_col = get_notifications_collection()
        notifs_col.insert_one({
            "recipient_id": rental["renter_id"],
            "type": "RENTAL_ACTIVE",
            "title": "Item Handover Verified! 🎉",
            "message": f"Pickup for '{item_title}' is confirmed and your rental is now ACTIVE.",
            "rental_id": rental["_id"],
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        })
    except Exception:
        pass

    updated_rental = rentals_col.find_one({"_id": obj_id})
    return JsonResponse({
        "message": "Pickup verified! Item is now ACTIVE with logged initial condition photos.",
        "rental": serialize_doc(updated_rental)
    }, status=200)

@csrf_exempt
def return_verification_view(request, rental_id):
    """
    POST /api/rentals/<rental_id>/verify-return/
    Owner verifies item condition on return.
    - If clean: returns security deposit to renter, credits rental fee to owner, marks AVAILABLE.
    - If damaged: marks DISPUTED, locks security deposit, creates dispute record.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    blocked_err = check_user_blocked(user)
    if blocked_err:
        return blocked_err

    obj_id = to_object_id(rental_id)
    rentals_col = get_rentals_collection()
    items_col = get_items_collection()
    users_col = get_users_collection()
    disputes_col = get_disputes_collection()
    notifs_col = get_notifications_collection()

    rental = rentals_col.find_one({"_id": obj_id})
    if not rental:
        return JsonResponse({"error": "Rental not found."}, status=404)

    # Only owner can verify return
    if str(rental.get("owner_id")) != str(user["_id"]) and user.get("role") != "ADMIN":
        return JsonResponse({"error": "Only the item owner can complete return verification."}, status=403)

    if rental.get("status") != "ACTIVE":
        return JsonResponse({"error": f"Cannot verify return: Rental is currently '{rental.get('status')}'.' (Expected 'ACTIVE')"}, status=400)

    try:
        data = json.loads(request.body.decode("utf-8"))
        if not isinstance(data, dict):
            return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
    except Exception:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    damage_reported = bool(data.get("damage_reported", False))
    notes = safe_str(data.get("notes", ""), max_length=500)
    photos = sanitize_image_list(
        data.get("photos", []),
        max_count=5,
        default_fallback="https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80"
    )
    damage_claimed_amount = safe_float(data.get("damage_claimed_amount", 0.0), default=0.0, min_val=0.0)

    if not photos:
        photos = ["https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80"]

    if not damage_reported:
        # CASE 1: Seamless Return - 100% Refundable Deposit Returned to Student
        deposit_amount = float(rental.get("security_deposit", 0))
        rental_fee = float(rental.get("rental_fee", 0))

        # 1. Refund deposit back to renter wallet
        users_col.update_one({"_id": rental["renter_id"]}, {"$inc": {"wallet_balance": deposit_amount}})

        # 2. Credit rental fee to owner wallet
        users_col.update_one({"_id": rental["owner_id"]}, {"$inc": {"wallet_balance": rental_fee}})

        # 3. Update rental record
        rentals_col.update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "status": "COMPLETED",
                    "deposit_status": "REFUNDED",
                    "refunded_deposit_amount": deposit_amount,
                    "condition_tracking.return_verification": {
                        "verified_at": datetime.now(timezone.utc),
                        "photos": photos,
                        "notes": notes or "Item returned in good condition. Deposit refunded.",
                        "damage_reported": False
                    }
                }
            }
        )

        # 4. Make item AVAILABLE again
        items_col.update_one({"_id": rental["item_id"]}, {"$set": {"availability_status": "AVAILABLE"}})

        # 5. Notify Renter of Deposit Refund
        notifs_col.insert_one({
            "recipient_id": rental["renter_id"],
            "type": "DEPOSIT_REFUNDED",
            "title": "Deposit Refunded!",
            "message": f"₹{deposit_amount:.2f} security deposit for rental has been credited back to your campus wallet.",
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        })

        # 6. Notify Owner of Earnings
        if rental_fee > 0:
            item_doc = items_col.find_one({"_id": rental["item_id"]})
            item_title_val = item_doc.get("title", "Resource") if item_doc else "Resource"
            notifs_col.insert_one({
                "recipient_id": rental["owner_id"],
                "type": "RENTAL_EARNING",
                "title": "Rental Earnings Credited!",
                "message": f"'{item_title_val}' was safely returned. ₹{rental_fee:.2f} rental earnings credited to your campus wallet.",
                "is_read": False,
                "created_at": datetime.now(timezone.utc)
            })

        # Record wallet transactions for refund and owner payout
        try:
            item_doc = items_col.find_one({"_id": rental["item_id"]})
            item_title = item_doc.get("title", "Resource") if item_doc else "Resource"
            get_wallet_transactions_collection().insert_one({
                "user_id": rental["renter_id"],
                "rental_id": rental["_id"],
                "type": "ESCROW_REFUND",
                "amount": deposit_amount,
                "description": f"100% Security Deposit Refund for '{item_title}'",
                "status": "REFUNDED",
                "created_at": datetime.now(timezone.utc)
            })
            if rental_fee > 0:
                get_wallet_transactions_collection().insert_one({
                    "user_id": rental["owner_id"],
                    "rental_id": rental["_id"],
                    "type": "RENTAL_EARNING",
                    "amount": rental_fee,
                    "description": f"Rental Earnings for '{item_title}'",
                    "status": "CREDITED",
                    "created_at": datetime.now(timezone.utc)
                })
        except Exception:
            pass

        return JsonResponse({
            "message": f"Return verified successfully! ₹{deposit_amount:.2f} security deposit refunded to renter, ₹{rental_fee:.2f} credited to owner.",
            "status": "COMPLETED",
            "deposit_status": "REFUNDED"
        }, status=200)

    else:
        # CASE 2: Damage Reported - Escalate to Dispute Management
        rentals_col.update_one(
            {"_id": obj_id},
            {
                "$set": {
                    "status": "DISPUTED",
                    "deposit_status": "LOCKED_IN_DISPUTE",
                    "condition_tracking.return_verification": {
                        "verified_at": datetime.now(timezone.utc),
                        "photos": photos,
                        "notes": notes or "Damage noted during return inspection.",
                        "damage_reported": True,
                        "damage_notes": notes
                    }
                }
            }
        )

        # Create Dispute Record with photo evidence links
        dispute_doc = {
            "rental_id": obj_id,
            "item_id": rental["item_id"],
            "raised_by": rental["owner_id"],
            "reported_against": rental["renter_id"],
            "claim_type": "ITEM_DAMAGE",
            "claimed_amount": min(damage_claimed_amount, float(rental.get("security_deposit", 0))),
            "description": notes,
            "evidence_photos": {
                "before_pickup": rental.get("condition_tracking", {}).get("pickup_verification", {}).get("photos", []),
                "after_return": photos
            },
            "status": "PENDING_ADMIN_REVIEW",
            "created_at": datetime.now(timezone.utc)
        }
        disputes_col.insert_one(dispute_doc)

        # Notify Renter & Admin
        notifs_col.insert_one({
            "recipient_id": rental["renter_id"],
            "type": "DISPUTE_RAISED",
            "title": "Item Damage Reported",
            "message": f"Owner reported damage for rental. Deposit of ₹{rental.get('security_deposit'):.2f} held pending dispute review.",
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        })

        return JsonResponse({
            "message": "Damage reported. Security deposit held in escrow and forwarded to Campus Dispute Manager.",
            "status": "DISPUTED",
            "deposit_status": "LOCKED_IN_DISPUTE"
        }, status=200)

@csrf_exempt
def disputes_list_view(request):
    """
    GET /api/rentals/disputes/
    Lists disputes for review. Admin sees all disputes; students see only their own disputes.
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required to access disputes."}, status=401)

    disputes_col = get_disputes_collection()
    users_col = get_users_collection()
    items_col = get_items_collection()

    if user.get("role") == "ADMIN":
        query = {}
    else:
        query = {"$or": [{"raised_by": user["_id"]}, {"reported_against": user["_id"]}]}

    disputes = list(disputes_col.find(query).sort("created_at", -1))
    
    # Resolve names
    for d in disputes:
        owner = users_col.find_one({"_id": d.get("raised_by")})
        renter = users_col.find_one({"_id": d.get("reported_against")})
        item = items_col.find_one({"_id": d.get("item_id")})
        d["owner_name"] = owner.get("name") if owner else "Unknown"
        d["renter_name"] = renter.get("name") if renter else "Unknown"
        d["item_title"] = item.get("title") if item else "Item"

    return JsonResponse({"disputes": serialize_doc(disputes)}, status=200)

@csrf_exempt
def resolve_dispute_view(request, dispute_id):
    """
    POST /api/rentals/disputes/<dispute_id>/resolve/
    Admin settles dispute: deducts repair amount from deposit, refunds remainder, penalizes violator.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    user = get_current_user_from_request(request)
    if not user or user.get("role") != "ADMIN":
        return JsonResponse({"error": "Admin privilege required to resolve disputes."}, status=403)

    obj_id = to_object_id(dispute_id)
    disputes_col = get_disputes_collection()
    rentals_col = get_rentals_collection()
    users_col = get_users_collection()
    items_col = get_items_collection()

    dispute = disputes_col.find_one({"_id": obj_id})
    if not dispute:
        return JsonResponse({"error": "Dispute not found."}, status=404)

    try:
        data = json.loads(request.body.decode("utf-8"))
        deduct_amount = float(data.get("deduct_amount", 0.0))
        notes = data.get("notes", "Dispute resolved by campus admin.")
        suspend_renter = bool(data.get("suspend_renter", False))
    except Exception:
        return JsonResponse({"error": "Invalid JSON or deduct_amount."}, status=400)

    rental = rentals_col.find_one({"_id": dispute["rental_id"]})
    if not rental:
        return JsonResponse({"error": "Rental contract not found."}, status=404)

    total_deposit = float(rental.get("security_deposit", 0))
    deduct_amount = min(deduct_amount, total_deposit)
    refund_amount = round(total_deposit - deduct_amount, 2)

    # 1. Transfer deducted repair cost to owner
    if deduct_amount > 0:
        users_col.update_one({"_id": dispute["raised_by"]}, {"$inc": {"wallet_balance": deduct_amount}})

    # 2. Refund remaining balance to renter
    if refund_amount > 0:
        users_col.update_one({"_id": dispute["reported_against"]}, {"$inc": {"wallet_balance": refund_amount}})

    # 3. Handle repeat violator trust score deduction or suspension
    if suspend_renter or deduct_amount > 0:
        users_col.update_one(
            {"_id": dispute["reported_against"]},
            {"$inc": {"trust_score": -1.0}}  # Penalty on student trust score
        )

    # 4. Update dispute and rental records
    disputes_col.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "RESOLVED",
                "admin_resolution": {
                    "resolved_by": user["name"],
                    "deducted_from_deposit": deduct_amount,
                    "refunded_to_renter": refund_amount,
                    "notes": notes,
                    "resolved_at": datetime.now(timezone.utc)
                }
            }
        }
    )

    rentals_col.update_one(
        {"_id": dispute["rental_id"]},
        {
            "$set": {
                "status": "COMPLETED_DISPUTE_SETTLED",
                "deposit_status": "DEDUCTED_IN_DISPUTE",
                "refunded_deposit_amount": refund_amount
            }
        }
    )

    # 5. Make item available again
    items_col.update_one({"_id": dispute["item_id"]}, {"$set": {"availability_status": "AVAILABLE"}})

    # 6. Notify both participants of dispute outcome
    try:
        notifs_col = get_notifications_collection()
        item_doc = items_col.find_one({"_id": dispute["item_id"]})
        item_title = item_doc.get("title", "Resource") if item_doc else "Resource"
        
        # Notify Owner
        notifs_col.insert_one({
            "recipient_id": dispute["raised_by"],
            "type": "DISPUTE_RESOLVED",
            "title": "Dispute Resolved by Admin",
            "message": f"Admin resolved dispute for '{item_title}'. Repair compensation of ₹{deduct_amount:.2f} credited to your wallet.",
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        })
        # Notify Renter
        notifs_col.insert_one({
            "recipient_id": dispute["reported_against"],
            "type": "DISPUTE_RESOLVED",
            "title": "Dispute Settled by Admin",
            "message": f"Admin settled dispute for '{item_title}'. Deposit balance of ₹{refund_amount:.2f} refunded to your wallet.",
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        })
    except Exception:
        pass

    return JsonResponse({
        "message": f"Dispute resolved! ₹{deduct_amount:.2f} awarded to owner for repairs, ₹{refund_amount:.2f} refunded to student.",
        "deducted_amount": deduct_amount,
        "refunded_amount": refund_amount
    }, status=200)

@csrf_exempt
def submit_review_view(request, rental_id):
    """
    POST /api/rentals/<rental_id>/review/
    Submits student rating and review for completed rental.
    Guarded against IDOR: only the actual renter or owner can review.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed. Use POST."}, status=405)

    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    blocked_err = check_user_blocked(user)
    if blocked_err:
        return blocked_err

    obj_id = to_object_id(rental_id)
    rentals_col = get_rentals_collection()
    items_col = get_items_collection()

    rental = rentals_col.find_one({"_id": obj_id})
    if not rental:
        return JsonResponse({"error": "Rental not found."}, status=404)

    # Authorization check (BOLA / IDOR defense): Only renter or owner can submit a review
    if str(rental.get("renter_id")) != str(user["_id"]) and str(rental.get("owner_id")) != str(user["_id"]) and user.get("role") != "ADMIN":
        return JsonResponse({"error": "Unauthorized: Only the contract participants can submit a review."}, status=403)

    if rental.get("status") not in ["COMPLETED", "COMPLETED_DISPUTE_SETTLED"]:
        return JsonResponse({"error": "Reviews can only be submitted after the rental is completed."}, status=400)

    try:
        data = json.loads(request.body.decode("utf-8"))
        if not isinstance(data, dict):
            return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
        rating = int(safe_float(data.get("rating", 5), default=5.0, min_val=1.0, max_val=5.0))
        comment = safe_str(data.get("comment", ""), max_length=1000)
    except Exception:
        return JsonResponse({"error": "Valid rating (1-5) and comment required."}, status=400)

    rating = max(1, min(5, rating))

    rentals_col.update_one(
        {"_id": obj_id},
        {"$set": {"rating_given": rating, "review_comment": comment}}
    )

    # Recalculate average item rating
    items_col.update_one(
        {"_id": rental["item_id"]},
        {
            "$inc": {"ratings.total_reviews": 1},
            "$set": {"ratings.average": round((float(rental.get("ratings", {}).get("average", 4.8)) + rating) / 2, 1)}
        }
    )

    return JsonResponse({"message": "Review submitted successfully!"}, status=200)

@csrf_exempt
def rental_status_view(request, rental_id):
    """
    GET /api/rentals/<rental_id>/status/
    Lightweight endpoint returning live rental state, handover status, and verification flags.
    Enables automatic QR modal auto-close and real-time confirmation.
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    blocked_err = check_user_blocked(user)
    if blocked_err:
        return blocked_err

    obj_id = to_object_id(rental_id)
    rentals_col = get_rentals_collection()
    rental = rentals_col.find_one({"_id": obj_id})
    if not rental:
        return JsonResponse({"error": "Rental not found."}, status=404)

    # Security check: only contract participants or admin
    if str(rental.get("renter_id")) != str(user["_id"]) and str(rental.get("owner_id")) != str(user["_id"]) and user.get("role") != "ADMIN":
        return JsonResponse({"error": "Unauthorized."}, status=403)

    return JsonResponse({
        "status": rental.get("status"),
        "is_active": rental.get("status") == "ACTIVE",
        "is_completed": rental.get("status") in ["COMPLETED", "COMPLETED_DISPUTE_SETTLED"],
        "pickup_verified": bool(rental.get("condition_tracking", {}).get("pickup_verification", {}).get("otp_verified")),
        "return_verified": bool(rental.get("condition_tracking", {}).get("return_verification")),
        "rental": serialize_doc(rental)
    }, status=200)

