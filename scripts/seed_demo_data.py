"""
Script: seed_demo_data.py
Populates MongoDB with realistic campus exchange records.
Aligned with CSE494 (BSON, Embedding vs Referencing, Schema) and INT253.

Run via: python scripts/seed_demo_data.py
"""

import sys
import os
import hashlib
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'campusshare_db'

def hash_password(password: str) -> str:
    """Simple SHA-256 password hash for easy viva understanding and verification."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def seed_database():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print(f"[*] Clearing existing collections in '{DB_NAME}'...")

    db.users.delete_many({})
    db.items.delete_many({})
    db.rentals.delete_many({})
    db.item_requests.delete_many({})
    db.disputes.delete_many({})
    db.notifications.delete_many({})

    # 1. Seed Users (Students and Admin)
    print("[*] Seeding Users...")
    common_pwd = hash_password("campus123")

    users_data = [
        {
            "_id": ObjectId("660000000000000000000001"),
            "name": "Aarav Sharma",
            "email": "aarav.sharma@college.edu",
            "password_hash": common_pwd,
            "phone": "+91 9876543210",
            "college_id": "STU2023001",
            "hostel_block": "Hostel Block A, Room 204",
            "role": "STUDENT",
            "is_verified": True,
            "trust_score": 4.9,
            "wallet_balance": 1500.0,
            "created_at": datetime.now() - timedelta(days=60)
        },
        {
            "_id": ObjectId("660000000000000000000002"),
            "name": "Priya Patel",
            "email": "priya.patel@college.edu",
            "password_hash": common_pwd,
            "phone": "+91 9876543211",
            "college_id": "STU2023045",
            "hostel_block": "Girls Hostel 2, Room 112",
            "role": "STUDENT",
            "is_verified": True,
            "trust_score": 4.8,
            "wallet_balance": 2000.0,
            "created_at": datetime.now() - timedelta(days=50)
        },
        {
            "_id": ObjectId("660000000000000000000003"),
            "name": "Rohit Verma",
            "email": "rohit.verma@college.edu",
            "password_hash": common_pwd,
            "phone": "+91 9876543212",
            "college_id": "STU2023102",
            "hostel_block": "Hostel Block B, Room 405",
            "role": "STUDENT",
            "is_verified": True,
            "trust_score": 4.6,
            "wallet_balance": 800.0,
            "created_at": datetime.now() - timedelta(days=40)
        },
        {
            "_id": ObjectId("660000000000000000000004"),
            "name": "Sneha Reddy",
            "email": "sneha.reddy@college.edu",
            "password_hash": common_pwd,
            "phone": "+91 9876543213",
            "college_id": "STU2023088",
            "hostel_block": "Girls Hostel 1, Room 302",
            "role": "STUDENT",
            "is_verified": True,
            "trust_score": 5.0,
            "wallet_balance": 1200.0,
            "created_at": datetime.now() - timedelta(days=30)
        },
        {
            "_id": ObjectId("660000000000000000000005"),
            "name": "Prof. D. Sen (Dispute Admin)",
            "email": "admin@college.edu",
            "password_hash": common_pwd,
            "phone": "+91 9876543299",
            "college_id": "FAC2020001",
            "hostel_block": "Faculty Quarters C-4",
            "role": "ADMIN",
            "is_verified": True,
            "trust_score": 5.0,
            "wallet_balance": 0.0,
            "created_at": datetime.now() - timedelta(days=120)
        }
    ]

    db.users.insert_many(users_data)
    print(f"  [+] Inserted {len(users_data)} users.")

    # 2. Seed Items (Referencing owner_id, embedding dynamic specifications & images)
    print("[*] Seeding Items across all campus categories...")

    items_data = [
        # Electronics
        {
            "_id": ObjectId("661000000000000000000001"),
            "owner_id": ObjectId("660000000000000000000001"),  # Aarav
            "title": "Casio fx-991EX ClassWiz Scientific Calculator",
            "category": "Electronics",
            "description": "Mint condition 552-function non-programmable calculator approved for university semester exams. Includes dual power solar cell and plastic cover.",
            "tags": ["calculator", "casio", "engineering", "maths", "fx991ex"],
            "rental_rate_per_day": 35.0,
            "security_deposit": 400.0,
            "replacement_value": 1400.0,
            "pickup_location": "Hostel Block A Common Room",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "brand": "Casio",
                "model": "fx-991EX ClassWiz",
                "battery_included": True,
                "exam_approved": True
            },
            "ratings": {"average": 4.9, "total_reviews": 8},
            "created_at": datetime.now() - timedelta(days=20)
        },
        # Lab & Academic
        {
            "_id": ObjectId("661000000000000000000002"),
            "owner_id": ObjectId("660000000000000000000002"),  # Priya
            "title": "Pure Cotton White Lab Coat (Unisex Size M)",
            "category": "Lab & Academic",
            "description": "Clean, freshly washed and ironed chemistry & biology lab coat. Heavy duty cotton with 3 pockets, knee length, full sleeves.",
            "tags": ["lab coat", "chemistry", "biology", "uniform", "cotton"],
            "rental_rate_per_day": 25.0,
            "security_deposit": 250.0,
            "replacement_value": 650.0,
            "pickup_location": "Girls Hostel 2 Security Desk",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "size": "Medium (38-40)",
                "material": "100% Preshrunk Cotton",
                "pockets": 3,
                "sanitized": True
            },
            "ratings": {"average": 5.0, "total_reviews": 6},
            "created_at": datetime.now() - timedelta(days=18)
        },
        # Sports
        {
            "_id": ObjectId("661000000000000000000003"),
            "owner_id": ObjectId("660000000000000000000003"),  # Rohit
            "title": "Yonex Nanoray Light 18i Badminton Racket (Strung with BG65)",
            "category": "Sports",
            "description": "Ultra-lightweight 77g graphite racket with 28 lbs string tension. Includes full head cover and 2 nylon shuttlecocks.",
            "tags": ["badminton", "yonex", "sports", "racket", "nanoray"],
            "rental_rate_per_day": 50.0,
            "security_deposit": 500.0,
            "replacement_value": 2200.0,
            "pickup_location": "Student Activity Center (SAC) Court Entrance",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1613918431703-aa503e3a51f3?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "weight": "77g (5U)",
                "tension": "28 lbs",
                "grip": "G4 with fresh overgrip",
                "includes": "Cover + 2 shuttles"
            },
            "ratings": {"average": 4.8, "total_reviews": 11},
            "created_at": datetime.now() - timedelta(days=15)
        },
        # Cycles & Mobility
        {
            "_id": ObjectId("661000000000000000000004"),
            "owner_id": ObjectId("660000000000000000000001"),  # Aarav
            "title": "Hero Sprint Pro 21-Speed Geared Mountain Bicycle",
            "category": "Cycles & Mobility",
            "description": "Smooth gear shifting Shimano tourney, front disc brake, front suspension, mudguards, and combination cable lock included. Perfect for cross-campus commute.",
            "tags": ["bicycle", "cycle", "hero", "geared", "mountain bike"],
            "rental_rate_per_day": 80.0,
            "security_deposit": 1000.0,
            "replacement_value": 8500.0,
            "pickup_location": "Hostel Block A Cycle Stand",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "gears": "21 Speed Shimano",
                "brakes": "Front Disc + Rear V-Brake",
                "lock_provided": True,
                "frame_size": "18 inch"
            },
            "ratings": {"average": 4.7, "total_reviews": 14},
            "created_at": datetime.now() - timedelta(days=25)
        },
        # Audio & Music
        {
            "_id": ObjectId("661000000000000000000005"),
            "owner_id": ObjectId("660000000000000000000004"),  # Sneha
            "title": "Yamaha F310 Full Size Acoustic Guitar + Padded Bag & Capo",
            "category": "Audio & Music",
            "description": "Rich acoustic sound with spruce top and rosewood fingerboard. Fitted with fresh D'Addario light phosphor bronze strings. Ideal for college music jams and cultural fests.",
            "tags": ["guitar", "acoustic", "yamaha", "music", "instrument"],
            "rental_rate_per_day": 90.0,
            "security_deposit": 1200.0,
            "replacement_value": 9000.0,
            "pickup_location": "Girls Hostel 1 Music Club Area",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "brand": "Yamaha",
                "model": "F310",
                "strings": "D'Addario 11-52 Phosphor Bronze",
                "accessories": "Capo, Tuner, 3 Picks, Padded Bag"
            },
            "ratings": {"average": 5.0, "total_reviews": 5},
            "created_at": datetime.now() - timedelta(days=12)
        },
        # Project Kits & Hardware
        {
            "_id": ObjectId("661000000000000000000006"),
            "owner_id": ObjectId("660000000000000000000003"),  # Rohit
            "title": "Arduino Uno Ultimate IoT Project Kit with 37 Sensor Modules",
            "category": "Project Kits",
            "description": "Complete micro-controller electronics prototyping kit. Includes Arduino Uno R3, ESP8266 Wi-Fi module, breadboards, ultrasonic, DHT11, relay, and jumper wires.",
            "tags": ["arduino", "iot", "electronics", "project", "sensors", "hardware"],
            "rental_rate_per_day": 60.0,
            "security_deposit": 600.0,
            "replacement_value": 3000.0,
            "pickup_location": "Hostel Block B Common Room",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "microcontroller": "ATmega328P",
                "modules_count": "37 verified working sensors",
                "wifi_capable": True,
                "power_supply": "9V battery adapter + USB cable"
            },
            "ratings": {"average": 4.8, "total_reviews": 9},
            "created_at": datetime.now() - timedelta(days=10)
        },
        # Books
        {
            "_id": ObjectId("661000000000000000000007"),
            "owner_id": ObjectId("660000000000000000000002"),  # Priya
            "title": "Introduction to Algorithms 4th Edition (CLRS) - Hardcover",
            "category": "Books",
            "description": "Standard university reference textbook for Data Structures and Algorithm Analysis. Clean pages, no scribbling, all diagrams and proofs intact.",
            "tags": ["algorithms", "clrs", "textbook", "computer science", "books"],
            "rental_rate_per_day": 20.0,
            "security_deposit": 300.0,
            "replacement_value": 1800.0,
            "pickup_location": "Central Library Lawn / Cafe",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "authors": "Cormen, Leiserson, Rivest, Stein",
                "edition": "4th International",
                "pages": 1312,
                "language": "English"
            },
            "ratings": {"average": 4.9, "total_reviews": 12},
            "created_at": datetime.now() - timedelta(days=22)
        },
        # Clothing & Costumes
        {
            "_id": ObjectId("661000000000000000000008"),
            "owner_id": ObjectId("660000000000000000000001"),  # Aarav
            "title": "Raymond Navy Blue Two-Piece Formal Suit (Size 38 Regular)",
            "category": "Clothing & Costumes",
            "description": "Premium formal blazer and matching trousers. Dry-cleaned and packed in suit garment bag. Perfect for placement interviews, GDs, and formal conferences.",
            "tags": ["suit", "blazer", "formal", "interview", "placement", "raymond"],
            "rental_rate_per_day": 120.0,
            "security_deposit": 1000.0,
            "replacement_value": 5500.0,
            "pickup_location": "Hostel Block A, Room 204",
            "availability_status": "AVAILABLE",
            "images": [
                "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80"
            ],
            "specifications": {
                "chest_size": "38 Regular",
                "trouser_waist": "32 inch",
                "color": "Midnight Navy Blue",
                "garment_bag": True
            },
            "ratings": {"average": 5.0, "total_reviews": 4},
            "created_at": datetime.now() - timedelta(days=8)
        }
    ]

    db.items.insert_many(items_data)
    print(f"  [+] Inserted {len(items_data)} items.")

    # 3. Seed Rentals with Embedded Condition Tracking (Unit III: Embedding)
    print("[*] Seeding Rentals with embedded condition tracking and deposit escrow...")

    rentals_data = [
        # Rental 1: COMPLETED (Everything verified, deposit refunded)
        {
            "_id": ObjectId("662000000000000000000001"),
            "item_id": ObjectId("661000000000000000000001"),  # Casio Calc
            "owner_id": ObjectId("660000000000000000000001"), # Aarav
            "renter_id": ObjectId("660000000000000000000002"),# Priya
            "start_date": datetime.now() - timedelta(days=14),
            "end_date": datetime.now() - timedelta(days=10),
            "rental_days": 4,
            "rental_fee": 140.0,
            "security_deposit": 400.0,
            "total_paid": 540.0,
            "status": "COMPLETED",
            "deposit_status": "REFUNDED",
            "condition_tracking": {
                "pickup_verification": {
                    "verified_at": datetime.now() - timedelta(days=14, hours=2),
                    "photos": [
                        "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80"
                    ],
                    "notes": "Calculator checked on pickup: solar cell functional, screen clear, cover included.",
                    "otp_verified": True
                },
                "return_verification": {
                    "verified_at": datetime.now() - timedelta(days=10, hours=1),
                    "photos": [
                        "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80"
                    ],
                    "notes": "Returned in identical condition. No issues.",
                    "damage_reported": False
                }
            },
            "refunded_deposit_amount": 400.0,
            "rating_given": 5,
            "review_comment": "Super handy for end-term exams! Aarav was prompt and helpful.",
            "created_at": datetime.now() - timedelta(days=15)
        },
        # Rental 2: ACTIVE (In progress, deposit currently HELD)
        {
            "_id": ObjectId("662000000000000000000002"),
            "item_id": ObjectId("661000000000000000000003"),  # Badminton Racket
            "owner_id": ObjectId("660000000000000000000003"), # Rohit
            "renter_id": ObjectId("660000000000000000000004"),# Sneha
            "start_date": datetime.now() - timedelta(days=1),
            "end_date": datetime.now() + timedelta(days=2),
            "rental_days": 3,
            "rental_fee": 150.0,
            "security_deposit": 500.0,
            "total_paid": 650.0,
            "status": "ACTIVE",
            "deposit_status": "HELD",
            "condition_tracking": {
                "pickup_verification": {
                    "verified_at": datetime.now() - timedelta(days=1, hours=4),
                    "photos": [
                        "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80"
                    ],
                    "notes": "Grip is fresh, strings tight at 28 lbs, no frame cracks.",
                    "otp_verified": True
                },
                "return_verification": {
                    "verified_at": None,
                    "photos": [],
                    "notes": "",
                    "damage_reported": False
                }
            },
            "refunded_deposit_amount": 0.0,
            "created_at": datetime.now() - timedelta(days=2)
        }
    ]

    db.rentals.insert_many(rentals_data)
    print(f"  [+] Inserted {len(rentals_data)} rental contracts.")

    # 4. Seed Item Demand Requests ("Notify Me" system)
    print("[*] Seeding Demand Requests...")
    requests_data = [
        {
            "_id": ObjectId("663000000000000000000001"),
            "student_id": ObjectId("660000000000000000000004"), # Sneha
            "category": "Lab & Academic",
            "keyword": "Lab Coat Size S/M",
            "needed_from": datetime.now() + timedelta(days=3),
            "needed_to": datetime.now() + timedelta(days=5),
            "max_budget_per_day": 30.0,
            "notes": "Urgent for Biochemistry practical exam next Tuesday",
            "status": "PENDING",
            "created_at": datetime.now() - timedelta(days=1)
        },
        {
            "_id": ObjectId("663000000000000000000002"),
            "student_id": ObjectId("660000000000000000000003"), # Rohit
            "category": "Audio & Music",
            "keyword": "Cajon Drum / Percussion box",
            "needed_from": datetime.now() + timedelta(days=6),
            "needed_to": datetime.now() + timedelta(days=8),
            "max_budget_per_day": 80.0,
            "notes": "For college hostel acoustic night performance",
            "status": "PENDING",
            "created_at": datetime.now() - timedelta(days=2)
        }
    ]
    db.item_requests.insert_many(requests_data)
    print(f"  [+] Inserted {len(requests_data)} demand requests.")

    # 5. Seed Notifications
    print("[*] Seeding Notifications...")
    notifs_data = [
        {
            "_id": ObjectId("664000000000000000000001"),
            "recipient_id": ObjectId("660000000000000000000001"),
            "type": "RENTAL_UPDATE",
            "title": "Rental Completed Successfully",
            "message": "Priya returned your Casio Scientific Calculator. Security deposit refunded.",
            "is_read": True,
            "created_at": datetime.now() - timedelta(days=10)
        },
        {
            "_id": ObjectId("664000000000000000000002"),
            "recipient_id": ObjectId("660000000000000000000004"),
            "type": "DEMAND_MATCH",
            "title": "Item Available Near You",
            "message": "Aarav Sharma listed an item matching your interest in Electronics.",
            "is_read": False,
            "created_at": datetime.now() - timedelta(hours=6)
        }
    ]
    db.notifications.insert_many(notifs_data)
    print(f"  [+] Inserted {len(notifs_data)} notifications.")

    print("\n[SUCCESS] Demo dataset populated successfully!")

if __name__ == "__main__":
    seed_database()
