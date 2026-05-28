"""Groups URL patterns — /api/v1/groups/"""
from django.urls import path
from apps.groups.views import (
    GroupListCreateView,
    GroupDetailView,
    GroupMembersView,
    GroupMemberDetailView,
    GroupBalancesView,
)
from apps.expenses.views import ExpenseListCreateView, ExpenseDetailView
from apps.settlements.views import SettlementListCreateView

urlpatterns = [
    path("", GroupListCreateView.as_view(), name="group-list-create"),
    path("<str:group_id>/", GroupDetailView.as_view(), name="group-detail"),
    path("<str:group_id>/members/", GroupMembersView.as_view(), name="group-members"),
    path("<str:group_id>/members/<str:user_id>/", GroupMemberDetailView.as_view(), name="group-member-detail"),
    path("<str:group_id>/balances/", GroupBalancesView.as_view(), name="group-balances"),
    path("<str:group_id>/expenses/", ExpenseListCreateView.as_view(), name="expense-list-create"),
    path("<str:group_id>/expenses/<str:expense_id>/", ExpenseDetailView.as_view(), name="expense-detail"),
    path("<str:group_id>/settlements/", SettlementListCreateView.as_view(), name="settlement-list-create"),
]
