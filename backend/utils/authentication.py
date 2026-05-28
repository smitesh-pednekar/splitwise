"""
Custom DRF authentication class.
Reads the Authorization: Bearer <token> header, decodes the JWT,
and attaches the MongoEngine User document to request.user.
"""

import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from utils.jwt_utils import decode_token


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return None  # No token — let permission class handle it

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired. Please log in again.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token.")

        # Import here to avoid circular imports at module load time
        from apps.users.models import User

        try:
            user = User.objects.get(id=payload["user_id"])
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found.")

        return (user, token)
