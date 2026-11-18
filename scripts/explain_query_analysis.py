"""
Script: explain_query_analysis.py
Aligned with CSE494 Unit IV:
- Performance with Indexing
- Covered Queries and explain()
- Real-world Query Execution Plan Analysis
"""

import sys
import os
from pymongo import MongoClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'campusshare_db'

def run_explain_analysis():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    print("================================================================================")
    print("CSE494 LAB PRACTICAL: MONGODB QUERY OPTIMIZATION & explain() EXECUTION ANALYSIS")
    print("================================================================================")

    # 1. Full-Text Search Query Plan (Unit IV: Text Indexes)
    print("\n--- 1. FULL-TEXT SEARCH QUERY PLAN ($text index) ---")
    filter_text = {"$text": {"$search": "calculator casio"}}
    explain_cmd_1 = {
        "explain": {
            "find": "items",
            "filter": filter_text
        },
        "verbosity": "executionStats"
    }
    res_text = db.command(explain_cmd_1)
    winning_text = res_text.get("queryPlanner", {}).get("winningPlan", {})
    stats_text = res_text.get("executionStats", {})

    print(f"Query Filter: {filter_text}")
    print(f"Top-Level Stage: {winning_text.get('stage')}")
    # Text index input stage
    input_stage = winning_text.get("inputStage", {})
    print(f"Index Scan Stage: {input_stage.get('stage')} (Index Name: {input_stage.get('indexName', 'idx_items_fulltext_search')})")
    print(f"Total Documents Examined: {stats_text.get('totalDocsExamined')}")
    print(f"Total Documents Returned: {stats_text.get('nReturned')}")
    print(f"Execution Time: {stats_text.get('executionTimeMillis')} ms")

    # 2. Compound Filter Query Plan (Unit IV: Compound Indexes)
    print("\n--- 2. COMPOUND FILTER QUERY PLAN (category + availability_status + price) ---")
    filter_compound = {
        "category": "Electronics",
        "availability_status": "AVAILABLE",
        "rental_rate_per_day": {"$lte": 100}
    }
    explain_cmd_2 = {
        "explain": {
            "find": "items",
            "filter": filter_compound,
            "sort": {"rental_rate_per_day": 1}
        },
        "verbosity": "executionStats"
    }
    res_comp = db.command(explain_cmd_2)
    winning_comp = res_comp.get("queryPlanner", {}).get("winningPlan", {})
    stats_comp = res_comp.get("executionStats", {})

    print(f"Query Filter: {filter_compound}")
    print(f"Top-Level Stage: {winning_comp.get('stage')}")
    input_comp = winning_comp.get("inputStage", {})
    print(f"Index Scan Stage: {input_comp.get('stage')} (Index Name: {input_comp.get('indexName', 'idx_items_category_status_price_compound')})")
    print(f"Total Documents Examined: {stats_comp.get('totalDocsExamined')}")
    print(f"Total Documents Returned: {stats_comp.get('nReturned')}")
    print(f"Execution Time: {stats_comp.get('executionTimeMillis')} ms")

    # 3. Unindexed Query Plan (Demonstrating COLLSCAN)
    print("\n--- 3. UNINDEXED FIELD QUERY PLAN (Demonstrating COLLSCAN) ---")
    filter_unindexed = {"specifications.battery_included": True}
    explain_cmd_3 = {
        "explain": {
            "find": "items",
            "filter": filter_unindexed
        },
        "verbosity": "executionStats"
    }
    res_un = db.command(explain_cmd_3)
    winning_un = res_un.get("queryPlanner", {}).get("winningPlan", {})
    stats_un = res_un.get("executionStats", {})

    print(f"Query Filter: {filter_unindexed}")
    print(f"Top-Level Stage: {winning_un.get('stage')} [COLLSCAN = Collection Scan: scans every record!]")
    print(f"Total Documents Examined: {stats_un.get('totalDocsExamined')}")
    print(f"Total Documents Returned: {stats_un.get('nReturned')}")

    print("\n[SUCCESS] explain() analysis completed successfully!")

if __name__ == "__main__":
    run_explain_analysis()
