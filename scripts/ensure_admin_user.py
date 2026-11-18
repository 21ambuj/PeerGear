"""
Ensure Admin User Exists in MongoDB
"""
import os
import sys
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusshare_backend.settings")
django.setup()

from campusshare_backend.db import get_users_collection
from accounts.utils import hash_password

def setup_admin():
    users_col = get_users_collection()
    admin_email = "admin@college.edu"
    admin_pass = "AdminPassword123!"
    
    existing = users_col.find_one({"email": admin_email})
    if existing:
        users_col.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "name": "Prof. D. Sen (Campus Admin)",
                    "password_hash": hash_password(admin_pass),
                    "role": "ADMIN",
                    "college_id": "ADMIN001",
                    "is_verified": True,
                    "is_email_verified": True,
                    "is_blocked": False,
                    "phone": "+91 9876500000",
                    "hostel_block": "Faculty Administration Block, R-101"
                }
            }
        )
        print(f"Updated existing admin user: {admin_email}")
    else:
        admin_doc = {
            "name": "Prof. D. Sen (Campus Admin)",
            "email": admin_email,
            "password_hash": hash_password(admin_pass),
            "college_id": "ADMIN001",
            "phone": "+91 9876500000",
            "hostel_block": "Faculty Administration Block, R-101",
            "role": "ADMIN",
            "is_verified": True,
            "is_email_verified": True,
            "is_blocked": False,
            "id_card_status": "VERIFIED",
            "verification_tier": "TIER_3_FACULTY_ENDORSED",
            "trust_score": 5.0,
            "wallet_balance": 10000.0,
            "created_at": datetime.now(timezone.utc)
        }
        users_col.insert_one(admin_doc)
        print(f"Created fresh admin user: {admin_email}")

    print("Admin credentials:")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_pass}")

if __name__ == "__main__":
    setup_admin()
