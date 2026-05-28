"""
Auth and user views.
POST /api/v1/auth/register/
POST /api/v1/auth/login/
GET  /api/v1/auth/me/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.users.models import User
from utils.jwt_utils import generate_token


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Validation
        errors = {}
        if not name:
            errors["name"] = "Name is required."
        if not email:
            errors["email"] = "Email is required."
        if not password or len(password) < 6:
            errors["password"] = "Password must be at least 6 characters."
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects(email=email).first():
            return Response(
                {"errors": {"email": "An account with this email already exists."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User(name=name, email=email)
        user.set_password(password)
        user.save()

        token = generate_token(str(user.id))
        return Response(
            {"token": token, "user": user.to_dict()},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"error": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects(email=email).first()
        if not user or not user.check_password(password):
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = generate_token(str(user.id))
        return Response({"token": token, "user": user.to_dict()})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": request.user.to_dict()})
