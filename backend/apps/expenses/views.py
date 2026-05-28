"""
Expenses views.
GET    /api/v1/groups/:group_id/expenses/
POST   /api/v1/groups/:group_id/expenses/
PUT    /api/v1/groups/:group_id/expenses/:expense_id/
DELETE /api/v1/groups/:group_id/expenses/:expense_id/
"""

import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.expenses.models import Expense, CATEGORY_CHOICES
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


class ExpenseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group, err = _get_group_member_or_error(group_id, request.user)
        if err:
            return err
        expenses = Expense.objects(group=group).order_by("-date")
        return Response({"expenses": [e.to_dict() for e in expenses]})

    def post(self, request, group_id):
        group, err = _get_group_member_or_error(group_id, request.user)
        if err:
            return err

        data = request.data
        description = data.get("description", "").strip()
        amount = data.get("amount")
        payer_id = data.get("payer_id")
        category = data.get("category", "Others")
        date_str = data.get("date")

        # Validation
        errors = {}
        if not description:
            errors["description"] = "Description is required."
        if not amount:
            errors["amount"] = "Amount is required."
        else:
            try:
                amount = float(amount)
                if amount <= 0:
                    errors["amount"] = "Amount must be greater than 0."
            except (ValueError, TypeError):
                errors["amount"] = "Amount must be a valid number."
        if not payer_id:
            errors["payer_id"] = "Payer is required."
        if category not in CATEGORY_CHOICES:
            errors["category"] = f"Category must be one of: {', '.join(CATEGORY_CHOICES)}."
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve payer
        try:
            payer = User.objects.get(id=payer_id)
        except Exception:
            return Response({"error": "Payer not found."}, status=status.HTTP_404_NOT_FOUND)

        if payer not in group.members:
            return Response({"error": "Payer must be a group member."}, status=status.HTTP_400_BAD_REQUEST)

        # Parse date
        try:
            expense_date = datetime.datetime.fromisoformat(date_str) if date_str else datetime.datetime.utcnow()
        except (ValueError, TypeError):
            expense_date = datetime.datetime.utcnow()

        # Snapshot current group members as participants
        expense = Expense(
            group=group,
            description=description,
            amount=amount,
            payer=payer,
            participants=list(group.members),  # snapshot
            category=category,
            date=expense_date,
            created_by=request.user,
        )
        expense.save()

        return Response({"expense": expense.to_dict()}, status=status.HTTP_201_CREATED)


class ExpenseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_expense(self, group_id, expense_id, current_user):
        group, err = _get_group_member_or_error(group_id, current_user)
        if err:
            return None, None, err
        try:
            expense = Expense.objects.get(id=expense_id, group=group)
        except Exception:
            return None, None, Response({"error": "Expense not found."}, status=status.HTTP_404_NOT_FOUND)
        return group, expense, None

    def _can_modify(self, expense, group, current_user):
        is_creator = str(expense.created_by.id) == str(current_user.id)
        is_admin = str(group.admin.id) == str(current_user.id)
        return is_creator or is_admin

    def put(self, request, group_id, expense_id):
        group, expense, err = self._get_expense(group_id, expense_id, request.user)
        if err:
            return err

        if not self._can_modify(expense, group, request.user):
            return Response(
                {"error": "Only the expense creator or group admin can edit this expense."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = request.data
        if "description" in data:
            expense.description = data["description"].strip()
        if "amount" in data:
            try:
                expense.amount = float(data["amount"])
            except (ValueError, TypeError):
                return Response({"error": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)
        if "payer_id" in data:
            try:
                payer = User.objects.get(id=data["payer_id"])
                if payer not in group.members:
                    return Response({"error": "Payer must be a group member."}, status=status.HTTP_400_BAD_REQUEST)
                expense.payer = payer
            except Exception:
                return Response({"error": "Payer not found."}, status=status.HTTP_404_NOT_FOUND)
        if "category" in data:
            if data["category"] not in CATEGORY_CHOICES:
                return Response({"error": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)
            expense.category = data["category"]
        if "date" in data:
            try:
                expense.date = datetime.datetime.fromisoformat(data["date"])
            except (ValueError, TypeError):
                pass

        expense.save()
        return Response({"expense": expense.to_dict()})

    def delete(self, request, group_id, expense_id):
        group, expense, err = self._get_expense(group_id, expense_id, request.user)
        if err:
            return err

        if not self._can_modify(expense, group, request.user):
            return Response(
                {"error": "Only the expense creator or group admin can delete this expense."},
                status=status.HTTP_403_FORBIDDEN,
            )

        expense.delete()
        return Response({"message": "Expense deleted successfully."})
