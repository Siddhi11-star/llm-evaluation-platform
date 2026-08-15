"""
Auth API routes — /api/v1/auth/*

Endpoints
---------
POST   /auth/signup        Register a new user
POST   /auth/login         Log in with email + password
GET    /auth/me            Get current user from JWT
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from functools import wraps

import jwt
from flask import Blueprint, jsonify, request, g
from email_validator import validate_email, EmailNotValidError

from config import cfg
from db.models import (
    create_user,
    find_user_by_email,
    find_user_by_id,
    verify_password,
)

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_token(user_id: str) -> str:
    """Create a signed JWT with the user's _id as subject."""
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=cfg.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, cfg.JWT_SECRET, algorithm="HS256")


def _decode_token(token: str) -> dict | None:
    """Decode and verify a JWT. Returns the payload or None."""
    try:
        return jwt.decode(token, cfg.JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def login_required(f):
    """Decorator that extracts & validates the Bearer token and sets g.user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = _decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        user = find_user_by_id(payload["sub"])
        if not user:
            return jsonify({"error": "User not found"}), 401

        g.user = user
        return f(*args, **kwargs)
    return decorated


# ── Signup ────────────────────────────────────────────────────────────────────

@auth_bp.route("/auth/signup", methods=["POST"])
def signup():
    """
    Register a new user.

    Request body:
    {
        "name": "Sarah Lin",
        "email": "sarah@acme.ai",
        "password": "min8chars"
    }
    """
    body = request.get_json(force=True)
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    # ── Validation ────────────────────────────────────────────────────────
    errors = []
    if not name:
        errors.append("Name is required.")
    if not email:
        errors.append("Email is required.")
    else:
        try:
            validated = validate_email(email, check_deliverability=False)
            email = validated.normalized
        except EmailNotValidError as e:
            errors.append(f"Invalid email: {e}")

    if len(password) < 8:
        errors.append("Password must be at least 8 characters.")

    if errors:
        return jsonify({"error": errors}), 400

    # ── Check for duplicate email ─────────────────────────────────────────
    if find_user_by_email(email):
        return jsonify({"error": "An account with this email already exists."}), 409

    # ── Create user ───────────────────────────────────────────────────────
    user_id = create_user(name, email, password)
    token = _generate_token(user_id)

    logger.info("New user registered: %s (%s)", email, user_id)
    return jsonify({
        "token": token,
        "user": {"_id": user_id, "name": name, "email": email},
    }), 201


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """
    Authenticate with email + password.

    Request body:
    {
        "email": "sarah@acme.ai",
        "password": "min8chars"
    }
    """
    body = request.get_json(force=True)
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = find_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid email or password."}), 401

    if not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid email or password."}), 401

    token = _generate_token(user["_id"])

    logger.info("User logged in: %s", email)
    return jsonify({
        "token": token,
        "user": {
            "_id": user["_id"],
            "name": user["name"],
            "email": user["email"],
        },
    }), 200


# ── Me (get current user) ────────────────────────────────────────────────────

@auth_bp.route("/auth/me", methods=["GET"])
@login_required
def me():
    """Return the currently authenticated user's profile."""
    user = g.user
    return jsonify({
        "user": {
            "_id": user["_id"],
            "name": user["name"],
            "email": user["email"],
        },
    }), 200
