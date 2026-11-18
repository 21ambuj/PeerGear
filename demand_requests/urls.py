"""
Demand Requests App URLs
Aligned with INT253 Unit II: Views and URLs.
"""

from django.urls import path
from demand_requests import views

urlpatterns = [
    path('', views.list_create_requests_view, name='requests-list-create'),
    path('<str:request_id>/', views.delete_request_view, name='request-delete'),
]
