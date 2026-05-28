"""
Group MongoEngine document.
members[] always includes the admin user.
"""

import datetime
import mongoengine as me
from apps.users.models import User


class Group(me.Document):
    name = me.StringField(required=True, max_length=200)
    admin = me.ReferenceField(User, required=True)
    members = me.ListField(me.ReferenceField(User))  # includes admin
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "groups",
    }

    def to_dict(self, current_user_id: str = None):
        return {
            "id": str(self.id),
            "name": self.name,
            "admin_id": str(self.admin.id),
            "members": [m.to_dict() for m in self.members],
            "created_at": self.created_at.isoformat(),
        }
