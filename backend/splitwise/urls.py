"""splitwise URL configuration."""

from django.urls import path, include
from utils.health import HealthCheckView

urlpatterns = [
    path("api/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/users/", include("apps.users.user_urls")),
    path("api/v1/groups/", include("apps.groups.urls")),
    path("api/v1/dashboard/", include("apps.users.dashboard_urls")),
]
