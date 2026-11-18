"""
Test Script: test_backend_api.py
Verifies Django REST endpoints and PyMongo queries work properly together.
Run via: python scripts/test_backend_api.py
"""

import os
import sys
import json
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusshare_backend.settings")
django.setup()

from django.test import Client

def run_api_tests():
    client = Client()
    print("================================================================================")
    print("CAMPUSSHARE: DJANGO REST & PYMONGO ENDPOINT VERIFICATION")
    print("================================================================================")

    # 1. Root API status check
    resp = client.get('/api/')
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    print(f"[+] Root API Healthcheck: Status {resp.status_code} OK")

    # 2. Login verification
    login_payload = json.dumps({
        "email": "aarav.sharma@college.edu",
        "password": "campus123"
    })
    resp = client.post('/api/accounts/login/', data=login_payload, content_type='application/json')
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.content}"
    login_data = resp.json()
    token = login_data.get("token")
    assert token, "Token not found in login response"
    print(f"[+] Student Authentication (JWT): Success for {login_data['user']['name']} (Wallet: Rs.{login_data['user']['wallet_balance']})")

    auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    # 3. Item listing & Text search
    resp = client.get('/api/items/')
    assert resp.status_code == 200
    items_data = resp.json()
    print(f"[+] Items List: Found {items_data.get('count')} available items")

    # 4. Full-text search
    resp = client.get('/api/items/?q=calculator')
    assert resp.status_code == 200
    search_data = resp.json()
    print(f"[+] Full-Text Search ($text 'calculator'): Found {search_data.get('count')} matching items")

    # 5. Smart Recommendations (MongoDB Aggregation Pipeline)
    resp = client.get('/api/analytics/recommendations/')
    assert resp.status_code == 200
    rec_data = resp.json()
    print(f"[+] Smart AI Recommendation Pipeline: Generated {rec_data.get('count')} scored recommendations")
    if rec_data.get("recommendations"):
        top_rec = rec_data["recommendations"][0]
        print(f"    -> Top Recommended: '{top_rec['title']}' (Score: {top_rec.get('recommendation_score')})")

    # 6. Platform Analytics Dashboard (MongoDB Aggregation Pipeline)
    resp = client.get('/api/analytics/dashboard/')
    assert resp.status_code == 200
    analytics_data = resp.json()
    print(f"[+] Platform Analytics ($group & $lookup): Category breakdowns calculated successfully")
    print(f"    -> Total Students: {analytics_data['summary']['total_students']}, Escrow Deposit: Rs.{analytics_data['summary']['escrow_held_deposit']}")

    # 7. Explain Demo Execution Stats
    resp = client.get('/api/analytics/explain-demo/')
    assert resp.status_code == 200
    explain_data = resp.json()
    print(f"[+] Live explain() Execution Benchmark:")
    for res in explain_data.get("results", []):
        print(f"    - [{res['index_type']}]: Stage={res['scan_stage']}, Examined={res['total_docs_examined']}, Time={res['execution_time_ms']}ms")

    print("\n[SUCCESS] All Django REST & PyMongo integration tests passed successfully!")

if __name__ == "__main__":
    run_api_tests()
