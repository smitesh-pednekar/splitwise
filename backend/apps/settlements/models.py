"""
Settlement MongoEngine document.
Records a payment from one group member to another.
"""

import datetime
import mongoengine as me
from apps.users.models import User
from apps.groups.models import Group


class Settlement(me.Document):
    group = me.ReferenceField(Group, required=True)
    payer = me.ReferenceField(User, required=True)   # person paying off debt
    payee = me.ReferenceField(User, required=True)   # person receiving payment
    amount = me.DecimalField(required=True, precision=2, min_value=0.01)
    date = me.DateTimeField(required=True)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "settlements",
        "indexes": ["group"],
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "group_id": str(self.group.id),
            "payer": self.payer.to_dict(),
            "payee": self.payee.to_dict(),
            "amount": float(self.amount),
            "date": self.date.isoformat(),
            "created_at": self.created_at.isoformat(),
        }
