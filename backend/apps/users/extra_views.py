"""
User search and dashboard balance views.
GET /api/v1/users/search/?email=
GET /api/v1/dashboard/balances/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.users.models import User
from apps.groups.models import Group
from apps.expenses.models import Expense
from apps.settlements.models import Settlement
from utils.balance_calculator import calculate_balances


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        email = request.query_params.get("email", "").strip().lower()
        if not email:
            return Response(
                {"error": "Email query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects(email=email).first()
        if not user:
            return Response(
                {"error": "No user found with that email address."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({"user": user.to_dict()})


class DashboardBalancesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user = request.user
        current_user_id = str(current_user.id)

        # All groups the current user is in
        groups = Group.objects(members=current_user)

        by_group = []
        total_owed_to_me = 0.0   # others owe me
        total_i_owe = 0.0        # I owe others

        for group in groups:
            expenses = Expense.objects(group=group)
            settlements = Settlement.objects(group=group)

            expense_dicts = [
                {
                    "payer_id": str(e.payer.id),
                    "participant_ids": [str(p.id) for p in e.participants],
                    "amount": float(e.amount),
                }
                for e in expenses
            ]
            settlement_dicts = [
                {
                    "payer_id": str(s.payer.id),
                    "payee_id": str(s.payee.id),
                    "amount": float(s.amount),
                }
                for s in settlements
            ]

            balances = calculate_balances(expense_dicts, settlement_dicts)

            group_net = 0.0
            for b in balances:
                if b["to_user_id"] == current_user_id:
                    group_net += b["amount"]
                    total_owed_to_me += b["amount"]
                elif b["from_user_id"] == current_user_id:
                    group_net -= b["amount"]
                    total_i_owe += b["amount"]

            by_group.append({
                "group_id": str(group.id),
                "group_name": group.name,
                "net": round(group_net, 2),
            })

        overall_net = round(total_owed_to_me - total_i_owe, 2)

        return Response({
            "overall_net": overall_net,
            "you_are_owed": round(total_owed_to_me, 2),
            "you_owe": round(total_i_owe, 2),
            "by_group": by_group,
        })
