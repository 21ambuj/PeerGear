"""
Script: clear_dummy_data.py
Removes all dummy data and resets collections for real user production usage.
"""

from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['campusshare_db']

collections = ['users', 'items', 'rentals', 'item_requests', 'disputes', 'notifications']

for col in collections:
    result = db[col].delete_many({})
    print(f"Cleared {result.deleted_count} documents from '{col}'.")

print("\nDatabase is now completely clean and ready for real user listings and registrations.")
