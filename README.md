# PeerGear: Peer-to-Peer Campus Resource Exchange & Smart Escrow Platform

An industry-standard, fully functional campus resource exchange and renting web application engineered for university students. 
Strictly designed and aligned with the course syllabi of:
1. **CSE494: Intelligent NoSQL Databases** (MongoDB, PyMongo, BSON, Aggregations, Explain Profiling, Schema Validation)
2. **INT253: Web Development in Python using Django** (Django REST Views, App Structuring, User Authentication, Request Validation, Error Handling)

---

## 🌟 Key Platform Features

- **College Verified Accounts**: Secure registration and login restricting or verifying campus students, with trust ratings and an embedded security deposit wallet.
- **Resource Catalog & Full-Text Search**: Explore badminton rackets, scientific calculators, pure cotton lab coats, bicycles, DSLR cameras, musical instruments, and project kits using MongoDB `$text` search and compound filters.
- **100% Refundable Security Deposit Escrow**: Protects resource owners by holding security deposits in escrow during the rental lifecycle, automatically refunding students upon undamaged return.
- **Digital Handover OTP & Condition Tracking**:
  - **Before Handover (Pickup)**: Verified with a 4-digit OTP and initial condition photos.
  - **After Return (Inspection)**: Side-by-side photographic condition inspection ledger.
- **Demand Board ("Notify Me When Available")**: Students can post requests for items they urgently need for practicals/fests; when any student lists a matching item, the system automatically dispatches notifications.
- **Fair Dispute Management**: Dedicated panel for college admin to inspect photo evidence, deduct repair costs from deposits, and penalize policy violators.
- **AI-Driven Recommendation Engine**: Evaluates item popularity, owner trust scores, and rental rates using native MongoDB Aggregation pipelines.
- **Live Query Optimizer (explain() benchmark)**: Live academic demonstration modal showing `IXSCAN` vs `COLLSCAN` execution statistics.

---

## 📚 Syllabus Mapping Matrix

### 1. CSE494: Intelligent NoSQL Databases

| Syllabus Unit | Course Requirement | Code Implementation in CampusShare |
| :--- | :--- | :--- |
| **Unit I & II** | NoSQL Data Models, BSON Data Types & CRUD | Dynamic category attributes stored using native BSON types (`ObjectId`, `ISODate`, `Double`, `Array`, `Boolean`) via PyMongo driver in `campusshare_backend/db.py`. |
| **Unit III** | Embedding vs. Referencing | - **Embedded**: Condition verification photos (`before_pickup`, `after_return`), timestamps, and reviews inside `rentals` documents.<br>- **Referenced**: `owner_id` and `renter_id` pointing to `users`, and `item_id` pointing to `items`. |
| **Unit III** | Schema Validation Rules & Constraints | Enforced engine-level validation using MongoDB `$jsonSchema` in `scripts/setup_mongo_indexes.py`. |
| **Unit IV** | Indexing Basics & Performance | - **Full-Text Index**: `db.items.create_index([("title", TEXT), ("description", TEXT), ("tags", TEXT)])`<br>- **Compound Index**: `db.items.create_index([("category", 1), ("availability_status", 1), ("rental_rate_per_day", 1)])`<br>- **Single/Unique Indexes**: on `email` and `college_id`. |
| **Unit IV** | Covered Queries & `explain()` | Benchmarking script `scripts/explain_query_analysis.py` and live UI modal demonstrating `IXSCAN` vs `COLLSCAN` metrics (`totalDocsExamined`, `executionTimeMillis`). |
| **Unit IV & V** | Aggregation Pipeline Framework | Multi-stage aggregation pipelines: `$match` -> `$lookup` -> `$unwind` -> `$group` -> `$project` -> `$sort` for revenue by category and platform metrics in `analytics/views.py`. |
| **Unit V & VI** | AI Analytics & Recommendation | Heuristic multi-attribute scoring pipeline prioritizing items based on ratings, owner trust rating, and affordability. |

### 2. INT253: Web Development in Python using Django

| Syllabus Unit | Course Requirement | Code Implementation in CampusShare |
| :--- | :--- | :--- |
| **Unit I & II** | Project & App Structuring, Views & URLs | Decoupled Django apps (`accounts`, `items`, `rentals`, `demand_requests`, `analytics`) with explicit HTTP method handling (`GET`, `POST`, `PUT`, `DELETE`). |
| **Unit IV** | Data Validation & HTTP Response Codes | Request sanitization and explicit HTTP response status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`). |
| **Unit V & VI** | User Management, JWT Authentication & Security | JWT token issuance and verification, hashed passwords, CORS headers, and protected endpoint decorators (`require_auth`). |

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- MongoDB Community Server (Running on `localhost:27017`)
- Node.js 18+ and npm

### 1. Database Setup & Indexing
Run the following scripts from the project root:
```bash
# Set up MongoDB indexes & $jsonSchema validation rules
python scripts/setup_mongo_indexes.py

# Seed realistic campus items, student personas, and rentals
python scripts/seed_demo_data.py

# Run live explain() query plan benchmark
python scripts/explain_query_analysis.py
```

### 2. Start Django Backend (Port 8000)
Double-click `run_backend.bat` or run:
```bash
python manage.py runserver 127.0.0.1:8000
```
- API Root: `http://127.0.0.1:8000/api/`

### 3. Start React Frontend (Port 5173)
Double-click `run_frontend.bat` or run:
```bash
cd campusshare_frontend
npm run dev
```
- Open browser at: `http://localhost:5173`

*(Tip: You can also double click `start_all.bat` to launch both backend and frontend together!)*

---

## 🎯 Demo Personas (1-Click Switcher in Navbar)

1. **Aarav Sharma** (`aarav.sharma@college.edu` / `campus123`): Student owner who lists calculators, cycles, and blazers.
2. **Priya Patel** (`priya.patel@college.edu` / `campus123`): Student who rents and lists lab coats and algorithm textbooks.
3. **Rohit Verma** (`rohit.verma@college.edu` / `campus123`): Student owner of badminton rackets and Arduino kits.
4. **Sneha Reddy** (`sneha.reddy@college.edu` / `campus123`): Student musician with acoustic guitars.
5. **Prof. D. Sen (Admin)** (`admin@college.edu` / `campus123`): College Dispute Resolution Officer.

---

## 🎓 Viva Questions & Answers

**Q1: Why did you choose MongoDB over a Relational SQL Database?**  
*Answer:* In a campus resource exchange, different item categories possess completely different dynamic specifications (e.g. bicycle frame sizes and gears vs calculator battery models and exam approvals vs lab coat sizes). A document database handles dynamic sub-documents cleanly without complex schema migrations or sparse relational tables.

**Q2: What is the difference between Embedding and Referencing in your project?**  
*Answer:* We **embedded** condition inspection photos, timestamps, and reviews inside the `rentals` documents because they are always read and displayed together. We **referenced** `owner_id` and `renter_id` pointing to the `users` collection to prevent redundant student data duplication across dozens of rentals.

**Q3: How does your indexing optimize query performance?**  
*Answer:* We implemented compound indexes on `(category, availability_status, rental_rate_per_day)` and a text index on `(title, description, tags)`. In our `explain()` analysis, indexed queries execute an `IXSCAN` examining only 1 document in ~1ms, whereas unindexed queries fall back to a full `COLLSCAN` examining every document in the collection.

**Q4: How does your smart recommendation engine work?**  
*Answer:* It executes a MongoDB Aggregation Pipeline utilizing `$lookup` to join owner reputation, calculates an heuristic score factoring in item rating ($20\times$), owner trust score ($10\times$), and price affordability ($0.3\times$), and sorts the catalog in descending order of recommendation score.
