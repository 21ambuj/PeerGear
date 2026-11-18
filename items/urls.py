"""
Items App URLs
Aligned with INT253 Unit II: Views and URLs.
"""

from django.urls import path
from items import views

urlpatterns = [
    path('', views.items_list_create_view, name='items-list-create'),
    path('categories/', views.categories_view, name='categories-list-create'),
    path('categories/<str:category_id>/', views.category_detail_view, name='category-detail'),
    path('my-items/', views.my_items_view, name='my-items'),
    path('<str:item_id>/', views.item_detail_view, name='item-detail'),
]
