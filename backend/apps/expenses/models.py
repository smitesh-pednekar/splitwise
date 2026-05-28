"""
Expense MongoEngine document.
participants[] is a snapshot of group members at the time of expense creation.
This ensures that members who later leave the group are still accounted for
in historical expense splits.
"""

import datetime
import mongoengine as me
from apps.users.models import User
from apps.groups.models import Group

CATEGORY_CHOICES = ("Food", "Travel", "Rent", "Utilities", "Others")


class Expense(me.Document):
    group = me.ReferenceField(Group, required=True)
    description = me.StringField(required=True, max_length=500)
    amount = me.DecimalField(required=True, precision=2, min_value=0.01)
    payer = me.ReferenceField(User, required=True)
    participants = me.ListField(me.ReferenceField(User))  # snapshot at creation time
    category = me.StringField(choices=CATEGORY_CHOICES, default="Others")
    date = me.DateTimeField(required=True)
    created_by = me.ReferenceField(User, required=True)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "expenses",
        "indexes": ["group", "-date"],
        "ordering": ["-date"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "group_id": str(self.group.id),
            "description": self.description,
            "amount": float(self.amount),
            "payer": self.payer.to_dict(),
            "participants": [p.to_dict() for p in self.participants],
            "category": self.category,
            "date": self.date.isoformat(),
            "created_by_id": str(self.created_by.id),
            "created_at": self.created_at.isoformat(),
        }
