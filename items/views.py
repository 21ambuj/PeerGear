"""
Items App Views
Aligned with:
- CSE494:
  - Unit II: CRUD Operations, BSON Data Types
  - Unit III: Embedding vs Referencing (specifications & images embedded, owner referenced)
  - Unit IV: Full-Text Search and Compound Index usage
- INT253:
  - Unit II: Views, Request & Response, Parameter handling
  - Unit IV: Form validation and POST handling
"""

import json
from datetime import datetime, timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from campusshare_backend.db import (
    get_items_collection, 
    get_users_collection, 
    get_rentals_collection,
    get_requests_collection,
    get_notifications_collection,
    get_categories_collection,
    serialize_doc, 
    to_object_id
)
from accounts.utils import (
    get_current_user_from_request, 
    require_auth, 
    check_user_blocked, 
    check_user_id_verified
)
from campusshare_backend.security import sanitize_text, safe_str, safe_float, sanitize_image_list

DEFAULT_CATEGORIES = [
    "Electronics", 
    "Books", 
    "Lab & Academic", 
    "Sports", 
    "Cycles & Mobility", 
    "Audio & Music", 
    "Clothing & Costumes", 
    "Project Kits"
]

def get_all_categories_list():
    """
    Returns (combined_categories_list, custom_categories_documents).
    Queries MongoDB 'categories' collection for user-defined custom categories
    and merges them with system defaults.
    """
    try:
        cats_col = get_categories_collection()
        custom_docs = list(cats_col.find().sort("created_at", 1))
    except Exception:
        custom_docs = []
    
    custom_names = [c["name"] for c in custom_docs if c.get("name")]
    combined = list(DEFAULT_CATEGORIES)
    for name in custom_names:
        if name not in combined:
            combined.append(name)
    return combined, custom_docs

@csrf_exempt
def items_list_create_view(request):
    """
    GET /api/items/ -> Search, filter, and list campus items
    POST /api/items/ -> Create a new resource listing
    """
    items_col = get_items_collection()
    users_col = get_users_collection()

    if request.method == "GET":
        category = safe_str(request.GET.get("category", "")).strip()
        search_query = safe_str(request.GET.get("q", "")).strip()
        status = safe_str(request.GET.get("status", "")).strip()
        sort_by = safe_str(request.GET.get("sort", "newest")).strip()
        raw_min = request.GET.get("min_price")
        raw_max = request.GET.get("max_price")

        # Build MongoDB Filter Query - CSE494 Unit II & IV
        query = {}
        if status:
            query["availability_status"] = status
        else:
            # Default to showing all available items unless requested
            query["availability_status"] = "AVAILABLE"

        if category and category != "All":
            query["category"] = category

        # Unit IV: Using Text Index if search query is provided
        if search_query:
            query["$text"] = {"$search": search_query}

        # Safe Price range filter (guarded against NaN / non-numeric injection)
        price_query = {}
        if raw_min is not None and str(raw_min).strip():
            parsed_min = safe_float(raw_min, default=None)
            if parsed_min is not None and parsed_min >= 0:
                price_query["$gte"] = parsed_min
        if raw_max is not None and str(raw_max).strip():
            parsed_max = safe_float(raw_max, default=None)
            if parsed_max is not None and parsed_max >= 0:
                price_query["$lte"] = parsed_max
        if price_query:
            query["rental_rate_per_day"] = price_query

        # Sorting strategy
        sort_config = [("created_at", -1)]
        if sort_by == "price_asc":
            sort_config = [("rental_rate_per_day", 1)]
        elif sort_by == "price_desc":
            sort_config = [("rental_rate_per_day", -1)]
        elif sort_by == "rating_desc":
            sort_config = [("ratings.average", -1)]
        elif sort_by == "relevance" and search_query:
            # Sort by text score if text search
            cursor = items_col.find(query, {"score": {"$meta": "textScore"}}).sort([("score", {"$meta": "textScore"})])
            items_list = list(cursor)
            # Attach owner details
            _attach_owners(items_list, users_col)
            return JsonResponse({"items": serialize_doc(items_list), "count": len(items_list)}, status=200)

        cursor = items_col.find(query).sort(sort_config)
        items_list = list(cursor)
        _attach_owners(items_list, users_col)

        return JsonResponse({"items": serialize_doc(items_list), "count": len(items_list)}, status=200)

    elif request.method == "POST":
        # Unit IV: Post handling with validation & authentication
        user = get_current_user_from_request(request)
        if not user:
            return JsonResponse({"error": "Authentication required to list an item."}, status=401)

        # Enforce account suspension check
        blocked_err = check_user_blocked(user)
        if blocked_err:
            return blocked_err

        # Enforce Student ID Card verification check
        id_err = check_user_id_verified(user, "list resources on PeerGear")
        if id_err:
            return id_err

        try:
            body_text = request.body.decode("utf-8")
            data = json.loads(body_text)
            if not isinstance(data, dict):
                return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
        except UnicodeDecodeError:
            return JsonResponse({"error": "Request body encoding error. Expected UTF-8."}, status=400)
        except json.JSONDecodeError as jde:
            return JsonResponse({
                "error": f"Invalid or truncated request data (payload size: {len(request.body)} bytes). If uploading a high-resolution photo, please retry with a smaller image."
            }, status=400)
        except Exception as e:
            return JsonResponse({"error": f"Invalid JSON body: {str(e)}"}, status=400)

        title = safe_str(data.get("title"), max_length=150)
        category = safe_str(data.get("category"), max_length=60)
        description = safe_str(data.get("description"), max_length=3000)
        pickup_location = safe_str(data.get("pickup_location"), max_length=150)
        raw_rate = data.get("rental_rate_per_day")
        raw_deposit = data.get("security_deposit")
        raw_replacement = data.get("replacement_value")
        raw_tags = data.get("tags", [])
        specifications = data.get("specifications", {})
        if not isinstance(specifications, dict):
            specifications = {}

        # Validation
        if not title or not category or raw_rate is None or raw_deposit is None:
            return JsonResponse({"error": "Title, category, rental rate, and security deposit are required."}, status=400)

        rental_rate = safe_float(raw_rate, default=-1.0)
        security_deposit = safe_float(raw_deposit, default=-1.0)
        if rental_rate <= 0 or security_deposit < 0:
            return JsonResponse({"error": "Rental rate must be > 0 and security deposit cannot be negative."}, status=400)

        if rental_rate > 50000 or security_deposit > 50000:
            return JsonResponse({"error": "Rental rate and security deposit cannot exceed ₹50,000 for safety."}, status=400)

        replacement_val = safe_float(raw_replacement, default=(rental_rate * 20 + security_deposit))

        allowed_cats, _ = get_all_categories_list()
        if category not in allowed_cats:
            # Auto-register new custom category in MongoDB
            try:
                get_categories_collection().insert_one({
                    "name": category.strip(),
                    "is_custom": True,
                    "created_by": user["_id"],
                    "created_at": datetime.now(timezone.utc)
                })
            except Exception:
                pass

        # Sanitize image URLs (strictly prevents javascript: / XSS payloads)
        images = sanitize_image_list(
            data.get("images", []),
            max_count=10,
            default_fallback="https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80"
        )

        # Sanitize tags
        if isinstance(raw_tags, str):
            raw_tags = raw_tags.split(",")
        tags = [safe_str(t, max_length=35).lower() for t in raw_tags if safe_str(t)]

        new_item = {
            "owner_id": user["_id"],  # Referencing owner
            "title": title,
            "category": category,
            "description": description,
            "tags": tags,
            "rental_rate_per_day": round(rental_rate, 2),
            "security_deposit": round(security_deposit, 2),
            "replacement_value": round(replacement_val, 2),
            "pickup_location": pickup_location or safe_str(user.get("hostel_block", "Campus Hostel")),
            "availability_status": "AVAILABLE",
            "images": images,
            "specifications": specifications,  # Embedded dynamic specs
            "ratings": {"average": 5.0, "total_reviews": 0},
            "created_at": datetime.now(timezone.utc)
        }

        result = items_col.insert_one(new_item)
        new_item["_id"] = result.inserted_id

        # AUTOMATED NOTIFICATION MATCHING (Core requirement):
        # Notify students who created a "Demand Request" for this category
        _trigger_demand_notifications(new_item, user)

        return JsonResponse({
            "message": "Resource listed successfully on CampusShare!",
            "item": serialize_doc(new_item)
        }, status=201)

    return JsonResponse({"error": "Method not allowed."}, status=405)

def _attach_owners(items_list, users_col):
    """Utility to attach rich owner info to items (Referencing resolution with campus trust badges)."""
    owner_ids = [item.get("owner_id") for item in items_list if item.get("owner_id")]
    if not owner_ids:
        return
    
    owners = {u["_id"]: u for u in users_col.find({"_id": {"$in": owner_ids}})}
    for item in items_list:
        owner = owners.get(item.get("owner_id"))
        if owner:
            item["owner"] = {
                "id": str(owner["_id"]),
                "name": owner.get("name"),
                "email": owner.get("email"),
                "college_id": owner.get("college_id", "CAMPUS-STUDENT"),
                "hostel_block": owner.get("hostel_block", "Campus Residence"),
                "trust_score": owner.get("trust_score", 5.0),
                "is_verified": bool(owner.get("is_verified", False)),
                "is_email_verified": bool(owner.get("is_email_verified", False)),
                "verification_tier": owner.get("verification_tier", "UNVERIFIED"),
                "id_card_status": owner.get("id_card_status", "NOT_UPLOADED"),
                "phone": owner.get("phone")
            }

def _trigger_demand_notifications(new_item, owner):
    """
    Checks the item_requests collection. If a student requested this category,
    sends them a notification that an item is now available.
    """
    try:
        requests_col = get_requests_collection()
        notifs_col = get_notifications_collection()
        
        matching_requests = list(requests_col.find({
            "category": new_item["category"],
            "status": "PENDING"
        }))

        for req in matching_requests:
            notif = {
                "recipient_id": req["student_id"],
                "type": "DEMAND_MATCH",
                "title": f"New {new_item['category']} Available!",
                "message": f"'{new_item['title']}' was just listed by {owner.get('name')} in {new_item.get('pickup_location')}.",
                "item_id": new_item["_id"],
                "is_read": False,
                "created_at": datetime.now(timezone.utc)
            }
            notifs_col.insert_one(notif)
    except Exception as e:
        print(f"Notification trigger error: {e}")

@csrf_exempt
def item_detail_view(request, item_id):
    """
    GET /api/items/<item_id>/ -> Item detail with owner profile
    PUT /api/items/<item_id>/ -> Update listing (Owner only)
    DELETE /api/items/<item_id>/ -> Remove listing (Owner only)
    """
    items_col = get_items_collection()
    users_col = get_users_collection()
    
    obj_id = to_object_id(item_id)
    if not obj_id:
        return JsonResponse({"error": "Invalid item ID format."}, status=400)

    item = items_col.find_one({"_id": obj_id})
    if not item:
        return JsonResponse({"error": "Item not found."}, status=404)

    if request.method == "GET":
        owner = users_col.find_one({"_id": item.get("owner_id")})
        if owner:
            item["owner"] = {
                "id": str(owner["_id"]),
                "name": owner.get("name"),
                "email": owner.get("email"),
                "phone": owner.get("phone"),
                "hostel_block": owner.get("hostel_block"),
                "trust_score": owner.get("trust_score", 5.0)
            }
        return JsonResponse({"item": serialize_doc(item)}, status=200)

    # Unit VI: Authenticated checks for updates and deletes with strict data isolation
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required to modify or delete listings."}, status=401)

    blocked_err = check_user_blocked(user)
    if blocked_err:
        return blocked_err

    if str(item.get("owner_id")) != str(user["_id"]) and user.get("role") != "ADMIN":
        return JsonResponse({"error": "Permission denied. You can only modify or delete your own listings."}, status=403)

    rentals_col = get_rentals_collection()

    if request.method == "PUT":
        try:
            body_text = request.body.decode("utf-8")
            data = json.loads(body_text)
            if not isinstance(data, dict):
                return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
        except UnicodeDecodeError:
            return JsonResponse({"error": "Request body encoding error. Expected UTF-8."}, status=400)
        except json.JSONDecodeError as jde:
            return JsonResponse({
                "error": f"Invalid or truncated request data (payload size: {len(request.body)} bytes). If uploading a high-resolution photo, please retry with a smaller image."
            }, status=400)
        except Exception as e:
            return JsonResponse({"error": f"Invalid JSON body: {str(e)}"}, status=400)

        update_fields = {}
        if "title" in data and data["title"] is not None:
            val = safe_str(data["title"], max_length=150)
            if val:
                update_fields["title"] = val

        if "description" in data and data["description"] is not None:
            update_fields["description"] = safe_str(data["description"], max_length=3000)

        if "pickup_location" in data and data["pickup_location"] is not None:
            val = safe_str(data["pickup_location"], max_length=150)
            if val:
                update_fields["pickup_location"] = val

        if "availability_status" in data and data["availability_status"] is not None:
            status_val = safe_str(data["availability_status"], max_length=30).upper()
            if status_val in ["AVAILABLE", "RENTED", "RESERVED", "MAINTENANCE"]:
                update_fields["availability_status"] = status_val

        if "category" in data and data["category"] is not None:
            cat_val = safe_str(data["category"], max_length=60)
            if cat_val:
                update_fields["category"] = cat_val

        if "rental_rate_per_day" in data:
            rate = safe_float(data["rental_rate_per_day"], default=-1.0)
            if rate <= 0 or rate > 50000:
                return JsonResponse({"error": "Rental rate must be a valid number between ₹1 and ₹50,000."}, status=400)
            update_fields["rental_rate_per_day"] = round(rate, 2)

        if "security_deposit" in data:
            dep = safe_float(data["security_deposit"], default=-1.0)
            if dep < 0 or dep > 50000:
                return JsonResponse({"error": "Security deposit must be between ₹0 and ₹50,000."}, status=400)
            update_fields["security_deposit"] = round(dep, 2)

        if "images" in data:
            sanitized_imgs = sanitize_image_list(data.get("images", []), max_count=10)
            if sanitized_imgs:
                update_fields["images"] = sanitized_imgs

        # Safeguard: If item has active rental, cannot mark AVAILABLE prematurely
        active_contract = rentals_col.find_one({
            "item_id": obj_id,
            "status": {"$in": ["BOOKED", "ACTIVE"]}
        })
        if active_contract and update_fields.get("availability_status") == "AVAILABLE":
            return JsonResponse({
                "error": f"Cannot mark AVAILABLE: An active rental contract ({active_contract['status']}) is currently ongoing."
            }, status=400)

        if update_fields:
            items_col.update_one({"_id": obj_id}, {"$set": update_fields})
            item = items_col.find_one({"_id": obj_id})

        return JsonResponse({"message": "Resource listing updated successfully.", "item": serialize_doc(item)}, status=200)

    elif request.method == "DELETE":
        # Safeguard: Prevent deleting items with active or booked contracts to protect escrow & renter
        active_contract = rentals_col.find_one({
            "item_id": obj_id,
            "status": {"$in": ["BOOKED", "ACTIVE", "DISPUTED"]}
        })
        if active_contract:
            return JsonResponse({
                "error": f"Cannot delete item: It currently has an ongoing rental contract ({active_contract['status']}). Please wait until the contract is completed."
            }, status=400)

        items_col.delete_one({"_id": obj_id})
        return JsonResponse({"message": "Listing deleted successfully from CampusShare.", "deleted_id": str(obj_id)}, status=200)

    return JsonResponse({"error": "Method not allowed."}, status=405)

@csrf_exempt
def categories_view(request):
    """
    GET /api/items/categories/
    Returns combined list of default + custom categories with active available counts.

    POST /api/items/categories/
    Creates a new custom category in MongoDB.
    """
    items_col = get_items_collection()
    cats_col = get_categories_collection()

    if request.method == "GET":
        combined_categories, custom_docs = get_all_categories_list()
        counts = {}
        for cat in combined_categories:
            counts[cat] = items_col.count_documents({"category": cat, "availability_status": "AVAILABLE"})

        return JsonResponse({
            "categories": combined_categories,
            "custom_categories": serialize_doc(custom_docs),
            "counts": counts
        }, status=200)

    elif request.method == "POST":
        user = get_current_user_from_request(request)
        if not user:
            return JsonResponse({"error": "Authentication required to add custom categories."}, status=401)

        try:
            data = json.loads(request.body.decode("utf-8"))
            if not isinstance(data, dict):
                return JsonResponse({"error": "Invalid JSON format."}, status=400)
            name = safe_str(data.get("name", ""), max_length=40).strip()
        except Exception:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        if not name or len(name) < 2:
            return JsonResponse({"error": "Category name must be at least 2 characters."}, status=400)

        if len(name) > 40:
            return JsonResponse({"error": "Category name must be under 40 characters."}, status=400)

        combined, _ = get_all_categories_list()
        if any(c.lower() == name.lower() for c in combined):
            return JsonResponse({"error": f"Category '{name}' already exists."}, status=400)

        new_cat = {
            "name": name,
            "is_custom": True,
            "created_by": user["_id"],
            "created_at": datetime.now(timezone.utc)
        }
        res = cats_col.insert_one(new_cat)
        new_cat["_id"] = str(res.inserted_id)

        return JsonResponse({
            "message": f"Custom category '{name}' created successfully.",
            "category": serialize_doc(new_cat)
        }, status=201)

    return JsonResponse({"error": "Method not allowed. Use GET or POST."}, status=405)

@csrf_exempt
def category_detail_view(request, category_id):
    """
    PUT /api/items/categories/<category_id>/
    Renames a custom category (Owner or Admin only) and updates related items.

    DELETE /api/items/categories/<category_id>/
    Deletes a custom category from the catalog (Owner or Admin only).
    """
    cats_col = get_categories_collection()
    items_col = get_items_collection()

    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required to manage custom categories."}, status=401)

    # Find custom category document by _id or name
    obj_id = to_object_id(category_id)
    cat = cats_col.find_one({"$or": [{"_id": obj_id}, {"name": str(category_id).strip()}]})
    if not cat:
        return JsonResponse({"error": "Custom category not found or is a system default protected category."}, status=404)

    # Authorization check (BOLA / IDOR defense)
    if cat.get("created_by") and str(cat.get("created_by")) != str(user["_id"]) and user.get("role") != "ADMIN":
        return JsonResponse({"error": "Permission denied. You can only modify categories you created."}, status=403)

    if request.method == "PUT":
        try:
            data = json.loads(request.body.decode("utf-8"))
            if not isinstance(data, dict):
                return JsonResponse({"error": "Invalid JSON format."}, status=400)
            new_name = safe_str(data.get("name", ""), max_length=40).strip()
        except Exception:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        if not new_name or len(new_name) < 2:
            return JsonResponse({"error": "New category name must be at least 2 characters."}, status=400)

        old_name = cat["name"]
        cats_col.update_one({"_id": cat["_id"]}, {"$set": {"name": new_name}})
        
        # Keep items synchronized with the renamed category
        items_col.update_many({"category": old_name}, {"$set": {"category": new_name}})

        return JsonResponse({
            "message": f"Category renamed from '{old_name}' to '{new_name}'.",
            "old_name": old_name,
            "new_name": new_name
        }, status=200)

    elif request.method == "DELETE":
        old_name = cat["name"]
        cats_col.delete_one({"_id": cat["_id"]})
        return JsonResponse({
            "message": f"Custom category '{old_name}' removed successfully.",
            "deleted_name": old_name
        }, status=200)

    return JsonResponse({"error": "Method not allowed. Use PUT or DELETE."}, status=405)

def my_items_view(request):
    """
    GET /api/items/my-items/
    Returns all items listed by current logged-in user.
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    items_col = get_items_collection()
    user_id = user["_id"]
    # Handle both ObjectId and string matches seamlessly
    query = {"$or": [{"owner_id": user_id}, {"owner_id": str(user_id)}]}
    my_items = list(items_col.find(query).sort("created_at", -1))
    return JsonResponse({"items": serialize_doc(my_items)}, status=200)
