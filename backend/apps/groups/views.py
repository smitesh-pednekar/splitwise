"""
Groups views.
GET    /api/v1/groups/
POST   /api/v1/groups/
GET    /api/v1/groups/:id/
DELETE /api/v1/groups/:id/
POST   /api/v1/groups/:id/members/
DELETE /api/v1/groups/:id/members/:user_id/
GET    /api/v1/groups/:id/balances/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.groups.models import Group
from apps.users.models import User
from apps.expenses.models import Expense
from apps.settlements.models import Settlement
from utils.balance_calculator import calculate_balances


def _get_group_or_404(group_id, current_user):
    """Fetch group by ID and verify current user is a member."""
    try:
        group = Group.objects.get(id=group_id)
    except (Group.DoesNotExist, Exception):
        return None, Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

    if current_user not in group.members:
        return None, Response({"error": "You are not a member of this group."}, status=status.HTTP_403_FORBIDDEN)

    return group, None


class GroupListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all groups the current user belongs to."""
        groups = Group.objects(members=request.user)
        return Response({"groups": [g.to_dict() for g in groups]})

    def post(self, request):
        """Create a new group. Creator becomes admin and first member."""
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "Group name is required."}, status=status.HTTP_400_BAD_REQUEST)

        group = Group(
            name=name,
            admin=request.user,
            members=[request.user],
        )
        group.save()
        return Response({"group": group.to_dict()}, status=status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group, err = _get_group_or_404(group_id, request.user)
        if err:
            return err
        return Response({"group": group.to_dict()})

    def delete(self, request, group_id):
        """Delete group (admin only). Cascades to expenses + settlements."""
        group, err = _get_group_or_404(group_id, request.user)
        if err:
            return err

        if group.admin.id != request.user.id:
            return Response({"error": "Only the group admin can delete this group."}, status=status.HTTP_403_FORBIDDEN)

        # Cascade delete
        Expense.objects(group=group).delete()
        Settlement.objects(group=group).delete()
        group.delete()

        return Response({"message": "Group deleted successfully."})


class GroupMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        """Add a member by email."""
        group, err = _get_group_or_404(group_id, request.user)
        if err:
            return err

        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user_to_add = User.objects(email=email).first()
        if not user_to_add:
            return Response(
                {"error": f"No registered user found with email '{email}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user_to_add in group.members:
            return Response({"error": "This user is already a member of the group."}, status=status.HTTP_400_BAD_REQUEST)

        group.members.append(user_to_add)
        group.save()

        return Response({"group": group.to_dict()}, status=status.HTTP_201_CREATED)


class GroupMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, group_id, user_id):
        """
        Remove a member from a group.
        Admin can remove anyone.
        A user can remove themselves (leave).
        """
        group, err = _get_group_or_404(group_id, request.user)
        if err:
            return err

        is_admin = group.admin.id == request.user.id
        is_self = str(request.user.id) == user_id

        if not is_admin and not is_self:
            return Response(
                {"error": "You do not have permission to remove this member."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Can't remove the admin from the group
        if str(group.admin.id) == user_id and not is_self:
            return Response({"error": "Cannot remove the group admin."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if target_user not in group.members:
            return Response({"error": "User is not a member of this group."}, status=status.HTTP_400_BAD_REQUEST)

        group.members.remove(target_user)
        group.save()

        return Response({"message": "Member removed successfully.", "group": group.to_dict()})


class GroupBalancesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        """Compute and return pairwise balances for a group."""
        group, err = _get_group_or_404(group_id, request.user)
        if err:
            return err

        expenses = Expense.objects(group=group)
        settlements = Settlement.objects(group=group)

        # Build a user ID → user dict lookup for enriching the response
        all_member_ids = set()
        expense_dicts = []
        for e in expenses:
            participant_ids = [str(p.id) for p in e.participants]
            all_member_ids.update(participant_ids)
            all_member_ids.add(str(e.payer.id))
            expense_dicts.append({
                "payer_id": str(e.payer.id),
                "participant_ids": participant_ids,
                "amount": float(e.amount),
            })

        settlement_dicts = []
        for s in settlements:
            all_member_ids.add(str(s.payer.id))
            all_member_ids.add(str(s.payee.id))
            settlement_dicts.append({
                "payer_id": str(s.payer.id),
                "payee_id": str(s.payee.id),
                "amount": float(s.amount),
            })

        raw_balances = calculate_balances(expense_dicts, settlement_dicts)

        # Enrich with user names (fetch once)
        user_map = {str(u.id): u.to_dict() for u in group.members}
        # Also include any participants who may have left
        for uid in all_member_ids:
            if uid not in user_map:
                try:
                    u = User.objects.get(id=uid)
                    d = u.to_dict()
                    d["name"] = d["name"] + " [Left]"
                    user_map[uid] = d
                except Exception:
                    user_map[uid] = {"id": uid, "name": "Unknown [Left]", "email": ""}

        enriched = []
        for b in raw_balances:
            enriched.append({
                "from_user": user_map.get(b["from_user_id"], {"id": b["from_user_id"], "name": "Unknown"}),
                "to_user": user_map.get(b["to_user_id"], {"id": b["to_user_id"], "name": "Unknown"}),
                "amount": b["amount"],
            })

        return Response({"group_id": group_id, "balances": enriched})
