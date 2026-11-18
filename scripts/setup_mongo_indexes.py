"""
Script: setup_mongo_indexes.py
Aligned with CSE494:
- Unit II: Creating Collections, Data Modeling, Indexes & Query Optimization
- Unit III: Validation Rules and Constraints ($jsonSchema)
- Unit IV: Indexing Basics (Single, Compound, Text Indexes)

Run via: python scripts/setup_mongo_indexes.py
"""

import sys
import os
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('MONGO_DB_NAME', 'campusshare_db')

def setup_database_and_indexes():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print(f"[*] Connected to MongoDB at {MONGO_URI}, database: '{DB_NAME}'")

    existing_collections = db.list_collection_names()

    # 1. Unit III: Apply Schema Validation Rules using $jsonSchema
    # Enforces integrity on the 'users' collection
    user_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "email", "password_hash", "college_id"],
            "properties": {
                "name": {
                    "bsonType": "string",
                    "description": "Student full name is required and must be a string"
                },
                "email": {
                    "bsonType": "string",
                    "pattern": "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
                    "description": "Must be a valid email address"
                },
                "college_id": {
                    "bsonType": "string",
                    "description": "Student college registration or ID number"
                },
                "wallet_balance": {
                    "bsonType": ["double", "int"],
                    "minimum": 0,
                    "description": "Security deposit wallet balance cannot be negative"
                }
            }
        }
    }

    # Item validator
    item_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["title", "category", "rental_rate_per_day", "security_deposit", "owner_id", "availability_status"],
            "properties": {
                "title": {"bsonType": "string"},
                "category": {
                    "bsonType": "string",
                    "description": "Category must be a valid text string (default or user-defined custom category)"
                },
                "rental_rate_per_day": {"bsonType": ["double", "int"], "minimum": 0},
                "security_deposit": {"bsonType": ["double", "int"], "minimum": 0},
                "availability_status": {
                    "enum": ["AVAILABLE", "RENTED", "RESERVED", "MAINTENANCE"],
                    "description": "Must reflect current inventory state"
                }
            }
        }
    }

    # Create collections with validators or update validator
    collections_to_validate = {
        "users": user_validator,
        "items": item_validator
    }

    for col_name, validator in collections_to_validate.items():
        if col_name not in existing_collections:
            db.create_collection(col_name, validator=validator)
            print(f"[+] Created collection '{col_name}' with $jsonSchema validation rules.")
        else:
            db.command({
                "collMod": col_name,
                "validator": validator,
                "validationLevel": "moderate"
            })
            print(f"[~] Updated $jsonSchema validator for existing collection '{col_name}'.")

    # 2. Unit IV: Indexing Implementation
    print("\n[*] Creating Indexes for Query Optimization...")

    # --- USERS Indexes ---
    db.users.create_index([("email", ASCENDING)], unique=True, name="idx_user_email_unique")
    db.users.create_index([("college_id", ASCENDING)], unique=True, name="idx_user_college_id_unique")
    print("  [+] users: Created unique indexes on 'email' and 'college_id'")

    # --- ITEMS Indexes ---
    # A. Text Index for Search (Unit IV)
    db.items.create_index(
        [("title", TEXT), ("description", TEXT), ("tags", TEXT)],
        weights={"title": 10, "tags": 5, "description": 1},
        name="idx_items_fulltext_search"
    )
    print("  [+] items: Created Text Index ('title', 'description', 'tags') for full-text keyword search")

    # B. Compound Index for Filter + Sort (Unit IV)
    db.items.create_index(
        [("category", ASCENDING), ("availability_status", ASCENDING), ("rental_rate_per_day", ASCENDING)],
        name="idx_items_category_status_price_compound"
    )
    print("  [+] items: Created Compound Index ('category', 'availability_status', 'rental_rate_per_day')")

    # C. Single Index for Owner queries
    db.items.create_index([("owner_id", ASCENDING)], name="idx_items_owner_id")
    print("  [+] items: Created Single Index on 'owner_id'")

    # --- RENTALS Indexes ---
    # Fast lookup for Renter active rentals
    db.rentals.create_index(
        [("renter_id", ASCENDING), ("status", ASCENDING), ("start_date", DESCENDING)],
        name="idx_rentals_renter_status_date_compound"
    )
    # Fast lookup for Owner incoming requests
    db.rentals.create_index(
        [("owner_id", ASCENDING), ("status", ASCENDING)],
        name="idx_rentals_owner_status_compound"
    )
    # Item lookup
    db.rentals.create_index([("item_id", ASCENDING)], name="idx_rentals_item_id")
    print("  [+] rentals: Created compound indexes for renter/owner lookups and single index on 'item_id'")

    # --- ITEM REQUESTS (Demand Board) Indexes ---
    db.item_requests.create_index([("category", ASCENDING), ("status", ASCENDING)], name="idx_requests_cat_status")
    print("  [+] item_requests: Created Compound Index on 'category' and 'status'")

    # --- NOTIFICATIONS Indexes ---
    db.notifications.create_index([("recipient_id", ASCENDING), ("is_read", ASCENDING)], name="idx_notif_recipient_read")
    print("  [+] notifications: Created Compound Index on 'recipient_id' and 'is_read'")

    print("\n[SUCCESS] All Collections, Schema Validators, and Indexes established successfully!")

if __name__ == "__main__":
    setup_database_and_indexes()
