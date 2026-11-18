"""
Analytics App URLs
Aligned with INT253 Unit II & CSE494 Unit IV/V.
"""

from django.urls import path
from analytics import views

urlpatterns = [
    path('recommendations/', views.smart_recommendations_view, name='analytics-recommendations'),
    path('dashboard/', views.platform_analytics_view, name='analytics-dashboard'),
    path('explain-demo/', views.explain_demo_view, name='analytics-explain-demo'),
    path('notifications/', views.notifications_view, name='notifications-list'),
    path('notifications/mark-read/', views.notifications_view, name='notifications-mark-read'),
]
