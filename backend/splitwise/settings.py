"""
Django settings for splitwise project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-in-production")

DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.users",
    "apps.groups",
    "apps.expenses",
    "apps.settlements",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "splitwise.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "splitwise.wsgi.application"

# MongoDB — no Django ORM DB config needed; MongoEngine connects directly
DATABASES = {}

# MongoEngine connection (called in apps.py or here)
import mongoengine
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/splitwise")
mongoengine.connect(host=MONGODB_URI)

# DRF — use our custom JWT authentication globally
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "utils.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    # Prevent DRF from loading Django ORM's AnonymousUser (incompatible with MongoEngine/no-SQL-DB setup)
    "UNAUTHENTICATED_USER": None,
}

# CORS
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
]
CORS_ALLOW_CREDENTIALS = True

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"

# JWT config
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-jwt-secret-change-in-production")
JWT_EXPIRY_DAYS = 7
