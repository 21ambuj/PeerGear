"""
Accounts Utility Module
Aligned with INT253 Unit VI: User Management, Authentication & Security.
"""

import jwt
import hashlib
import json
from datetime import datetime, timezone, timedelta
from django.conf import settings
from django.http import JsonResponse
from bson import ObjectId
from campusshare_backend.db import get_users_collection, to_object_id

def hash_password(password: str, salt: str = None) -> str:
    """
    Computes cryptographic salted SHA-256 hash of password.
    Prevents pre-computed rainbow table lookups and hash reversal.
    """
    if not salt:
        salt = settings.SECRET_KEY[:16]
    salted_str = f"{salt}:${password}"
    return hashlib.sha256(salted_str.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """
    Securely verifies password against stored hash with fallback support
    for legacy unsalted hashes so existing accounts are not locked out.
    """
    if not plain_password or not stored_hash:
        return False
    # Check against salted hash
    if hash_password(plain_password) == stored_hash:
        return True
    # Backward-compatible check for legacy unsalted SHA-256
    legacy_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    if legacy_hash == stored_hash:
        return True
    return False

def generate_jwt(user_dict: dict) -> str:
    """Generates a signed JWT token containing student identity."""
    payload = {
        "user_id": str(user_dict["_id"]),
        "email": user_dict["email"],
        "name": user_dict["name"],
        "role": user_dict.get("role", "STUDENT"),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXP_DAYS)
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token

def decode_jwt(token: str) -> dict:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None


def get_current_user_from_request(request):
    """
    Extracts the authenticated user document from Authorization header:
    Authorization: Bearer <token>
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1].strip()
    payload = decode_jwt(token)
    if not payload:
        return None
    
    user_id = to_object_id(payload.get("user_id"))
    if not user_id:
        return None
    
    users_col = get_users_collection()
    user = users_col.find_one({"_id": user_id})
    return user

def require_auth(view_func):
    """
    View decorator that enforces user authentication.
    Returns 401 Unauthorized if token is missing or invalid.
    Returns 403 Forbidden if user account has been suspended.
    """
    def wrapper(request, *args, **kwargs):
        user = get_current_user_from_request(request)
        if not user:
            return JsonResponse({"error": "Authentication required. Please log in with your campus account."}, status=401)
        if user.get("is_blocked", False):
            reason = user.get("blocked_reason") or "Violation of campus community guidelines"
            return JsonResponse({
                "error": f"Your campus account has been suspended by administration. Reason: {reason}",
                "is_blocked": True
            }, status=403)
        request.user_doc = user
        return view_func(request, *args, **kwargs)
    return wrapper

def check_user_blocked(user):
    """
    Utility check: Verifies if a student's account has been suspended by administration.
    Returns JsonResponse(..., status=403) if blocked, otherwise None.
    """
    if not user:
        return None
    if user.get("is_blocked", False):
        reason = user.get("blocked_reason") or "Violation of campus community guidelines"
        return JsonResponse({
            "error": f"Your campus account has been suspended by administration. Reason: {reason}",
            "is_blocked": True,
            "blocked_reason": reason
        }, status=403)
    return None

def check_user_id_verified(user, action_name="perform this action"):
    """
    Utility check: Enforces that a student has completed Student ID Card verification
    before listing resources, booking rentals, or posting requests.
    Campus administrators (role == 'ADMIN') are automatically exempt.
    Returns JsonResponse(..., status=403) if unverified, otherwise None.
    """
    if not user:
        return None
    if user.get("role") == "ADMIN":
        return None
    
    id_status = user.get("id_card_status", "NOT_UPLOADED")
    if id_status != "VERIFIED":
        if id_status == "PENDING_VERIFICATION":
            msg = f"Your College ID card is currently under review by campus administration. Once approved, you can {action_name}."
        elif id_status == "REJECTED":
            reason = user.get("id_card_rejection_reason") or "Invalid or unreadable document"
            msg = f"Your College ID card was rejected by administration: '{reason}'. Please re-upload a valid ID to {action_name}."
        else:
            msg = f"College ID Card verification required: Please upload your physical College ID card to unlock permissions to {action_name}."
        
        return JsonResponse({
            "error": msg,
            "requires_id_verification": True,
            "id_card_status": id_status,
            "rejection_reason": user.get("id_card_rejection_reason")
        }, status=403)
    return None

def require_admin(view_func):
    """
    View decorator that enforces administrative privileges (role == 'ADMIN').
    Returns 401 if unauthenticated, 403 if authenticated but not an Admin.
    """
    def wrapper(request, *args, **kwargs):
        user = get_current_user_from_request(request)
        if not user:
            return JsonResponse({"error": "Administrative authentication required. Please sign in to the Admin Portal."}, status=401)
        if user.get("is_blocked", False):
            return JsonResponse({"error": "Administrative account has been suspended."}, status=403)
        if user.get("role") != "ADMIN":
            return JsonResponse({"error": "Access denied. Administrator privileges required."}, status=403)
        request.user_doc = user
        return view_func(request, *args, **kwargs)
    return wrapper
