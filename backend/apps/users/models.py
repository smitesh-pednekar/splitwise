"""
User MongoEngine document.
Password stored as bcrypt hash — never raw.
"""

import datetime
import bcrypt
import mongoengine as me


class User(me.Document):
    name = me.StringField(required=True, max_length=150)
    email = me.EmailField(required=True, unique=True)
    password = me.StringField(required=True)  # bcrypt hash
    is_active = me.BooleanField(default=True)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        "collection": "users",
        "indexes": ["email"],
    }

    def set_password(self, raw_password: str):
        """Hash and store a plain-text password."""
        hashed = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt())
        self.password = hashed.decode("utf-8")

    def check_password(self, raw_password: str) -> bool:
        """Verify a plain-text password against the stored hash."""
        return bcrypt.checkpw(
            raw_password.encode("utf-8"),
            self.password.encode("utf-8"),
        )

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }

    # Required by DRF's authentication contract
    @property
    def is_authenticated(self):
        return True
