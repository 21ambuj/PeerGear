"""
Analytics & AI Recommendation Views
Aligned with CSE494:
- Unit IV: Aggregation Pipeline Concepts, Multi-stage Real-World Examples ($match, $lookup, $unwind, $group, $project, $sort)
- Unit IV: Covered Queries and explain()
- Unit V: MongoDB for AI-based Predictive Analytics & Query Optimization
"""

import json
from datetime import datetime, timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from campusshare_backend.db import (
    get_db,
    get_items_collection,
    get_rentals_collection,
    get_users_collection,
    get_notifications_collection,
    serialize_doc,
    to_object_id
)
from accounts.utils import get_current_user_from_request
from campusshare_backend.security import safe_str

def smart_recommendations_view(request):
    """
    GET /api/analytics/recommendations/
    CSE494 Unit V: AI-driven Recommendation Engine using MongoDB Aggregation Pipeline.
    Scores items based on availability, rating, owner trust score, and price efficiency.
    """
    db = get_db()
    items_col = get_items_collection()

    preferred_category = safe_str(request.GET.get("category", "")).strip()

    match_stage = {"availability_status": "AVAILABLE"}
    if preferred_category and preferred_category != "All":
        match_stage["category"] = preferred_category

    # MongoDB Multi-stage Aggregation Pipeline (Unit IV & V)
    pipeline = [
        {"$match": match_stage},
        # Stage 1: $lookup owner profile from 'users' collection
        {
            "$lookup": {
                "from": "users",
                "localField": "owner_id",
                "foreignField": "_id",
                "as": "owner"
            }
        },
        # Stage 2: $unwind owner array to object
        {"$unwind": "$owner"},
        # Stage 3: $project to compute Smart Heuristic Recommendation Score
        {
            "$project": {
                "title": 1,
                "category": 1,
                "description": 1,
                "tags": 1,
                "rental_rate_per_day": 1,
                "security_deposit": 1,
                "pickup_location": 1,
                "images": 1,
                "specifications": 1,
                "ratings": 1,
                "created_at": 1,
                "owner_info": {
                    "id": "$owner._id",
                    "name": "$owner.name",
                    "hostel_block": "$owner.hostel_block",
                    "trust_score": "$owner.trust_score"
                },
                # AI Scoring Formula:
                # Score = (Rating * 20) + (Owner Trust * 10) + max(0, (100 - Daily Rate)) * 0.4
                "recommendation_score": {
                    "$round": [
                        {
                            "$add": [
                                {"$multiply": [{"$ifNull": ["$ratings.average", 4.5]}, 20]},
                                {"$multiply": [{"$ifNull": ["$owner.trust_score", 4.5]}, 10]},
                                {
                                    "$multiply": [
                                        {
                                            "$max": [
                                                0,
                                                {"$subtract": [120, "$rental_rate_per_day"]}
                                            ]
                                        },
                                        0.3
                                    ]
                                }
                            ]
                        },
                        1
                    ]
                }
            }
        },
        # Stage 4: $sort by highest recommendation score
        {"$sort": {"recommendation_score": -1}},
        # Stage 5: $limit top 8 recommendations
        {"$limit": 8}
    ]

    try:
        recommended_items = list(items_col.aggregate(pipeline))
        return JsonResponse({
            "algorithm": "Heuristic Multi-Attribute Aggregation Ranking (CSE494 Unit V)",
            "count": len(recommended_items),
            "recommendations": serialize_doc(recommended_items)
        }, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def platform_analytics_view(request):
    """
    GET /api/analytics/dashboard/
    CSE494 Unit IV: Real-world Aggregation Pipeline for Category Analytics and Platform Metrics.
    """
    db = get_db()
    rentals_col = get_rentals_collection()
    items_col = get_items_collection()
    users_col = get_users_collection()

    # Pipeline 1: Category rental volume and revenue aggregation
    category_pipeline = [
        # Join with items collection
        {
            "$lookup": {
                "from": "items",
                "localField": "item_id",
                "foreignField": "_id",
                "as": "item"
            }
        },
        {"$unwind": "$item"},
        # Group by item.category
        {
            "$group": {
                "_id": "$item.category",
                "total_rentals": {"$sum": 1},
                "total_revenue": {"$sum": "$rental_fee"},
                "avg_rental_days": {"$avg": "$rental_days"},
                "total_deposits_managed": {"$sum": "$security_deposit"}
            }
        },
        # Project clean fields
        {
            "$project": {
                "category": "$_id",
                "_id": 0,
                "total_rentals": 1,
                "total_revenue": {"$round": ["$total_revenue", 2]},
                "avg_rental_days": {"$round": ["$avg_rental_days", 1]},
                "total_deposits_managed": {"$round": ["$total_deposits_managed", 2]}
            }
        },
        {"$sort": {"total_rentals": -1}}
    ]

    category_stats = list(rentals_col.aggregate(category_pipeline))

    # Overall Platform Summary Stats
    total_users = users_col.count_documents({})
    total_items = items_col.count_documents({})
    available_items = items_col.count_documents({"availability_status": "AVAILABLE"})
    active_rentals = rentals_col.count_documents({"status": "ACTIVE"})
    completed_rentals = rentals_col.count_documents({"status": "COMPLETED"})
    
    # Total deposit escrow volume currently held
    held_deposits_cur = rentals_col.aggregate([
        {"$match": {"deposit_status": "HELD"}},
        {"$group": {"_id": None, "total_held": {"$sum": "$security_deposit"}}}
    ])
    held_list = list(held_deposits_cur)
    escrow_held = held_list[0]["total_held"] if held_list else 0.0

    return JsonResponse({
        "summary": {
            "total_students": total_users,
            "total_listings": total_items,
            "available_listings": available_items,
            "active_rentals": active_rentals,
            "completed_rentals": completed_rentals,
            "escrow_held_deposit": escrow_held
        },
        "category_breakdown": serialize_doc(category_stats)
    }, status=200)

def explain_demo_view(request):
    """
    GET /api/analytics/explain-demo/
    CSE494 Unit IV: Live explain() execution analysis for academic viva presentation.
    Shows the exact execution stats of Indexed vs Unindexed queries.
    """
    db = get_db()
    
    # 1. Text Search Explain
    text_cmd = {
        "explain": {
            "find": "items",
            "filter": {"$text": {"$search": "calculator"}}
        },
        "verbosity": "executionStats"
    }
    text_explain = db.command(text_cmd)

    # 2. Compound Index Explain
    comp_cmd = {
        "explain": {
            "find": "items",
            "filter": {"category": "Electronics", "availability_status": "AVAILABLE"},
            "sort": {"rental_rate_per_day": 1}
        },
        "verbosity": "executionStats"
    }
    comp_explain = db.command(comp_cmd)

    # 3. Unindexed COLLSCAN Explain
    unindexed_cmd = {
        "explain": {
            "find": "items",
            "filter": {"specifications.battery_included": True}
        },
        "verbosity": "executionStats"
    }
    unindexed_explain = db.command(unindexed_cmd)

    def extract_metrics(res, index_type):
        wp = res.get("queryPlanner", {}).get("winningPlan", {})
        es = res.get("executionStats", {})
        input_stage = wp.get("inputStage", {})
        return {
            "index_type": index_type,
            "top_stage": wp.get("stage"),
            "scan_stage": input_stage.get("stage", wp.get("stage")),
            "index_used": input_stage.get("indexName", "None (COLLSCAN)"),
            "total_docs_examined": es.get("totalDocsExamined"),
            "docs_returned": es.get("nReturned"),
            "execution_time_ms": es.get("executionTimeMillis")
        }

    return JsonResponse({
        "title": "CSE494 Unit IV: MongoDB Query Optimization Benchmark",
        "results": [
            extract_metrics(text_explain, "Full-Text Search Index ($text)"),
            extract_metrics(comp_explain, "Compound Index (category + status + price)"),
            extract_metrics(unindexed_explain, "Unindexed Field Scan (COLLSCAN)")
        ]
    }, status=200)

@csrf_exempt
def notifications_view(request):
    """
    GET /api/analytics/notifications/ -> Get user notifications
    POST /api/analytics/notifications/mark-read/ -> Mark all as read
    """
    user = get_current_user_from_request(request)
    if not user:
        return JsonResponse({"error": "Authentication required."}, status=401)

    notifs_col = get_notifications_collection()

    if request.method == "GET":
        notifs = list(notifs_col.find({"recipient_id": user["_id"]}).sort("created_at", -1).limit(20))
        unread_count = notifs_col.count_documents({"recipient_id": user["_id"], "is_read": False})
        return JsonResponse({
            "notifications": serialize_doc(notifs),
            "unread_count": unread_count
        }, status=200)

    elif request.method == "POST":
        notifs_col.update_many({"recipient_id": user["_id"]}, {"$set": {"is_read": True}})
        return JsonResponse({"message": "All notifications marked as read."}, status=200)

    return JsonResponse({"error": "Method not allowed."}, status=405)
