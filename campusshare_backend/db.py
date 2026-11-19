"""
MongoDB Connection and Utility Module
Aligned with CSE494 Unit V: MongoDB Integration using Python (PyMongo).

Provides:
- Thread-safe MongoClient singleton
- Collection accessors
- BSON to JSON serialization helpers (converting ObjectId and ISODate)
"""

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime, date
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

_mongo_client = None

def get_mongo_client() -> MongoClient:
    """Returns a singleton MongoClient instance."""
    global _mongo_client
    if _mongo_client is None:
        try:
            client_kwargs = {
                'serverSelectionTimeoutMS': 10000,
                'maxPoolSize': 50
            }
            # Use certifi CA bundle if available for secure cloud TLS connections (MongoDB Atlas)
            try:
                import certifi
                client_kwargs['tlsCAFile'] = certifi.where()
            except ImportError:
                pass

            _mongo_client = MongoClient(
                settings.MONGO_URI,
                **client_kwargs
            )
            # Test connection
            _mongo_client.admin.command('ping')
            logger.info("Successfully connected to MongoDB server.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e
    return _mongo_client

def get_db() -> Database:
    """Returns the campusshare database handle."""
    client = get_mongo_client()
    return client[settings.MONGO_DB_NAME]

# Collection Accessors - Unit II & III
def get_users_collection() -> Collection:
    return get_db()['users']

def get_items_collection() -> Collection:
    return get_db()['items']

def get_rentals_collection() -> Collection:
    return get_db()['rentals']

def get_requests_collection() -> Collection:
    return get_db()['item_requests']

def get_disputes_collection() -> Collection:
    return get_db()['disputes']

def get_notifications_collection() -> Collection:
    return get_db()['notifications']

def get_wallet_transactions_collection() -> Collection:
    return get_db()['wallet_transactions']

def get_categories_collection() -> Collection:
    return get_db()['categories']

def get_email_otps_collection() -> Collection:
    return get_db()['email_otps']

# BSON Serialization Helper - Unit II (BSON Data Types)
def serialize_doc(doc):
    """
    Recursively converts BSON types (ObjectId, datetime) into JSON-serializable types.
    """
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, (datetime, date)):
                result[key] = value.isoformat()
            elif isinstance(value, dict) or isinstance(value, list):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, (datetime, date)):
        return doc.isoformat()
    return doc

def to_object_id(id_str):
    """Safely converts string to ObjectId, returns None if invalid."""
    try:
        if isinstance(id_str, ObjectId):
            return id_str
        return ObjectId(str(id_str))
    except Exception:
        return None
