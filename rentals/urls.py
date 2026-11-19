"""
Rentals App URLs
Aligned with INT253 Unit II: Views and URLs.
"""

from django.urls import path
from rentals import views

urlpatterns = [
    path('book/', views.create_rental_booking, name='rental-book'),
    path('my-rentals/', views.my_rentals_view, name='my-rentals'),
    path('disputes/', views.disputes_list_view, name='disputes-list'),
    path('disputes/<str:dispute_id>/resolve/', views.resolve_dispute_view, name='resolve-dispute'),
    path('<str:rental_id>/status/', views.rental_status_view, name='rental-status'),
    path('<str:rental_id>/verify-pickup/', views.pickup_verification_view, name='verify-pickup'),
    path('<str:rental_id>/verify-return/', views.return_verification_view, name='verify-return'),
    path('<str:rental_id>/review/', views.submit_review_view, name='submit-review'),
]
