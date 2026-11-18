"""
Full Database Wipe & Admin Initialization Script
Wipes all student data, items, rentals, disputes, notifications, wallet transactions,
email OTPs, categories, and uploaded ID documents.
Re-creates the clean administrator account: admin@college.edu / AdminPassword123!
"""

import os
import sys
import shutil
from pathlib import Path
from datetime import datetime, timezone

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusshare_backend.settings")

import django
django.setup()

from campusshare_backend.db import get_db
from accounts.utils import hash_password

def wipe_all():
    db = get_db()
    collections = [
        'users',
        'items',
        'rentals',
        'disputes',
        'item_requests',
        'wallet_transactions',
        'notifications',
        'email_otps',
        'categories'
    ]

    print("=" * 60)
    print("      WIPING ALL DATABASE COLLECTIONS")
    print("=" * 60)

    for col_name in collections:
        res = db[col_name].delete_many({})
        print(f"[-] Cleared {res.deleted_count:>4} documents from '{col_name}'")

    # Clean uploaded media files
    media_id_cards = BASE_DIR / "media" / "id_cards"
    deleted_files = 0
    if media_id_cards.exists():
        for file_path in media_id_cards.glob("*"):
            if file_path.is_file():
                try:
                    file_path.unlink()
                    deleted_files += 1
                except Exception as e:
                    print(f"Could not delete {file_path.name}: {e}")
    print(f"[-] Deleted {deleted_files} uploaded ID card files from media/id_cards/")

    # Re-create fresh Admin User
    admin_email = "admin@college.edu"
    admin_pass = "AdminPassword123!"
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
    db['users'].insert_one(admin_doc)
    print(f"[+] Recreated official Administrator: {admin_email}")

    print("=" * 60)
    print("DATABASE COMPLETELY CLEAN & READY FOR FRESH LIVE USE!")
    print("=" * 60)

if __name__ == "__main__":
    wipe_all()
