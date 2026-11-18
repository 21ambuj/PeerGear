import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusshare_backend.settings")
django.setup()

from campusshare_backend.db import get_users_collection

users = get_users_collection()
res = users.update_many(
    {"email": {"$in": ["victim_sec@campus.edu", "attacker_sec@campus.edu", "third_party@campus.edu", "owner_test@campus.edu", "renter_test@campus.edu"]}},
    {"$set": {"is_email_verified": True}}
)
print("Updated count:", res.modified_count)
