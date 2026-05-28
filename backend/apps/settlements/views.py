"""
Settlements views.
GET  /api/v1/groups/:group_id/settlements/
POST /api/v1/groups/:group_id/settlements/
"""

import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.settlements.models import Settlement
from apps.groups.models import Group
from apps.users.models import User


def _get_group_member_or_error(group_id, current_user):
    try:
        group = Group.objects.get(id=group_id)
    except Exception:
        return None, Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)
    if current_user not in group.members:
        return None, Response({"error": "You are not a member of this group."}, status=status.HTTP_403_FORBIDDEN)
    return group, None


class SettlementListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group, err = _get_group_member_or_error(group_id, request.user)
        if err:
            return err
        settlements = Settlement.objects(group=group).order_by("-date")
        return Response({"settlements": [s.to_dict() for s in settlements]})

    def post(self, request, group_id):
        group, err = _get_group_member_or_error(group_id, request.user)
        if err:
            return err

        data = request.data
        payer_id = data.get("payer_id")
        payee_id = data.get("payee_id")
        amount = data.get("amount")
        date_str = data.get("date")

        # Validation
        errors = {}
        if not payer_id:
            errors["payer_id"] = "Payer is required."
        if not payee_id:
            errors["payee_id"] = "Payee is required."
        if payer_id and payee_id and payer_id == payee_id:
            errors["payee_id"] = "Payer and payee cannot be the same person."
        if not amount:
            errors["amount"] = "Amount is required."
        else:
            try:
                amount = float(amount)
                if amount <= 0:
                    errors["amount"] = "Amount must be greater than 0."
            except (ValueError, TypeError):
                errors["amount"] = "Amount must be a valid number."
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve users
        try:
            payer = User.objects.get(id=payer_id)
        except Exception:
            return Response({"error": "Payer not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            payee = User.objects.get(id=payee_id)
        except Exception:
            return Response({"error": "Payee not found."}, status=status.HTTP_404_NOT_FOUND)

        # Parse date
        try:
            settlement_date = datetime.datetime.fromisoformat(date_str) if date_str else datetime.datetime.utcnow()
        except (ValueError, TypeError):
            settlement_date = datetime.datetime.utcnow()

        settlement = Settlement(
            group=group,
            payer=payer,
            payee=payee,
            amount=amount,
            date=settlement_date,
        )
        settlement.save()

        return Response({"settlement": settlement.to_dict()}, status=status.HTTP_201_CREATED)
