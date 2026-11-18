"""
Demand Requests App Views ("Notify Me" & Resource Wishlist)
Aligned with:
- CSE494 Unit II & III: CRUD on item_requests collection
- INT253 Unit II & IV: HTTP requests, forms, and responses
"""

import json
from datetime import datetime, timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from campusshare_backend.db import (
    get_requests_collection,
    get_users_collection,
    get_items_collection,
    get_notifications_collection,
    serialize_doc,
    to_object_id
)
from accounts.utils import get_current_user_from_request
from campusshare_backend.security import sanitize_text, safe_str, safe_float

@csrf_exempt
def list_create_requests_view(request):
    """
    GET /api/requests/ -> View all open campus demand requests with real-time matching available items
    POST /api/requests/ -> Post an item request (Notify me when available)
    """
    requests_col = get_requests_collection()
    users_col = get_users_collection()
    items_col = get_items_collection()

    if request.method == "GET":
        category = safe_str(request.GET.get("category", "")).strip()
        query = {"status": "PENDING"}
        if category and category != "All":
            query["category"] = category

        requests_list = list(requests_col.find(query).sort("created_at", -1))
        
        # Attach student info
        student_ids = [r["student_id"] for r in requests_list if "student_id" in r]
        students = {u["_id"]: u for u in users_col.find({"_id": {"$in": student_ids}})}
        
        for r in requests_list:
            st = students.get(r.get("student_id"))
            if st:
                r["student"] = {
                    "name": st.get("name"),
                    "hostel_block": st.get("hostel_block"),
                    "trust_score": st.get("trust_score", 5.0)
                }

            # Find available campus items matching this category
            cat_query = {
                "category": r.get("category"),
                "availability_status": "AVAILABLE"
            }
            matched_docs = list(items_col.find(cat_query).limit(4))
            r["matching_items"] = serialize_doc(matched_docs)

        return JsonResponse({"requests": serialize_doc(requests_list)}, status=200)

    elif request.method == "POST":
        user = get_current_user_from_request(request)
        if not user:
            return JsonResponse({"error": "Authentication required to post a request."}, status=401)

        try:
            data = json.loads(request.body.decode("utf-8"))
            if not isinstance(data, dict):
                return JsonResponse({"error": "Invalid JSON format: expected object."}, status=400)
        except Exception:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        category = safe_str(data.get("category", ""), max_length=60).strip()
        keyword = safe_str(data.get("keyword", ""), max_length=150).strip()
        max_budget = safe_float(data.get("max_budget_per_day", 50.0), default=50.0, min_val=1.0, max_val=50000.0)
        needed_from = safe_str(data.get("needed_from", ""), max_length=30)
        needed_to = safe_str(data.get("needed_to", ""), max_length=30)
        notes = safe_str(data.get("notes", ""), max_length=500).strip()

        if not category or not keyword:
            return JsonResponse({"error": "Category and item keyword/name are required."}, status=400)

        new_request = {
            "student_id": user["_id"],
            "category": category,
            "keyword": keyword,
            "max_budget_per_day": round(max_budget, 2),
            "needed_from": needed_from,
            "needed_to": needed_to,
            "notes": notes,
            "status": "PENDING",
            "created_at": datetime.now(timezone.utc)
        }

        result = requests_col.insert_one(new_request)
        new_request["_id"] = result.inserted_id

        return JsonResponse({
            "message": "Item request posted! You will be automatically notified as soon as an owner lists this item.",
            "request": serialize_doc(new_request)
        }, status=201)

    return JsonResponse({"error": "Method not allowed."}, status=405)

@csrf_exempt
def delete_request_view(request, request_id):
    """
    DELETE /api/requests/<request_id>/
    Removes an item request.
    """
    if request.method != "DELETE":
        return JsonResponse({"error": "Use DELETE method."}, status=405)

    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    obj_id = to_object_id(request_id)
    requests_col = get_requests_collection()
    req = requests_col.find_one({"_id": obj_id})
    if not req:
        return JsonResponse({"error": "Request not found."}, status=404)

    if str(req.get("student_id")) != str(user["_id"]) and user.get("role") != "ADMIN":
        return JsonResponse({"error": "Unauthorized to delete this request."}, status=403)

    requests_col.delete_one({"_id": obj_id})
    return JsonResponse({"message": "Request deleted."}, status=200)
