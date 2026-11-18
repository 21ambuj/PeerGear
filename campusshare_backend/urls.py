"""
URL configuration for campusshare_backend project.
Aligned with INT253 Unit II: Creating Views and Mapping to URLs.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def api_root_status(request):
    return JsonResponse({
        "project": "CampusShare API",
        "description": "College-focused Peer-to-Peer Resource Exchange & Renting Platform",
        "syllabi": [
            "CSE494: Intelligent NoSQL Databases (PyMongo, Aggregations, BSON, Explain, Schemas)",
            "INT253: Web Development in Python using Django (REST Views, URLs, Auth, Session/Token, Validation)"
        ],
        "status": "ONLINE",
        "endpoints": {
            "accounts": "/api/accounts/",
            "items": "/api/items/",
            "rentals": "/api/rentals/",
            "demand_requests": "/api/requests/",
            "analytics": "/api/analytics/"
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api_root_status, name='api-root'),
    path('api/', api_root_status, name='api-status'),
    
    # API endpoints (supports both with /api/ and direct paths without /api/)
    path('api/accounts/', include('accounts.urls')),
    path('accounts/', include('accounts.urls')),
    
    path('api/items/', include('items.urls')),
    path('items/', include('items.urls')),
    
    path('api/rentals/', include('rentals.urls')),
    path('rentals/', include('rentals.urls')),
    
    path('api/requests/', include('demand_requests.urls')),
    path('requests/', include('demand_requests.urls')),
    
    path('api/analytics/', include('analytics.urls')),
    path('analytics/', include('analytics.urls')),
]

from django.urls import re_path
from django.views.static import serve

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
