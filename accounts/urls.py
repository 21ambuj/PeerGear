"""
Accounts App URLs
Aligned with INT253 Unit II: Creating Views and Mapping to URLs.
"""

from django.urls import path
from accounts import views

urlpatterns = [
    path('register/', views.register_view, name='account-register'),
    path('verify-email-otp/', views.verify_email_otp_view, name='account-verify-email-otp'),
    path('resend-email-otp/', views.resend_email_otp_view, name='account-resend-email-otp'),
    path('upload-id-card/', views.upload_id_card_view, name='account-upload-id-card'),
    path('login/', views.login_view, name='account-login'),
    path('profile/', views.profile_view, name='account-profile'),
    path('wallet/', views.wallet_view, name='account-wallet'),
    path('wallet-history/', views.wallet_history_view, name='account-wallet-history'),
    path('students/', views.students_list_view, name='students-list'),
    
    # Campus Administration & Moderation Endpoints
    path('admin/login/', views.admin_login_view, name='admin-login'),
    path('admin/users/', views.admin_users_list_view, name='admin-users-list'),
    path('admin/users/<str:user_id>/verify-id/', views.admin_verify_id_view, name='admin-verify-id'),
    path('admin/users/<str:user_id>/toggle-block/', views.admin_toggle_block_view, name='admin-toggle-block'),
]
