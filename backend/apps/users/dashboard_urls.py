"""Dashboard routes — /api/v1/dashboard/"""
from django.urls import path
from apps.users.extra_views import DashboardBalancesView

urlpatterns = [
    path("balances/", DashboardBalancesView.as_view(), name="dashboard-balances"),
]
