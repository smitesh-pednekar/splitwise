"""
JWT utility functions.
Uses PyJWT directly (DRF SimpleJWT is incompatible with MongoEngine).
"""

import jwt
import datetime
from django.conf import settings


def generate_token(user_id: str) -> str:
    """Encode a JWT token containing user_id, expiring in JWT_EXPIRY_DAYS days."""
    payload = {
        "user_id": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=settings.JWT_EXPIRY_DAYS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises jwt.ExpiredSignatureError if expired.
    Raises jwt.InvalidTokenError if invalid.
    Returns the payload dict on success.
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
