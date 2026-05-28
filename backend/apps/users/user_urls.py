"""User search routes — /api/v1/users/"""
from django.urls import path
from apps.users.extra_views import UserSearchView

urlpatterns = [
    path("search/", UserSearchView.as_view(), name="user-search"),
]
