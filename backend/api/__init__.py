"""
Flask application factory.
"""

from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)  # Allow frontend at localhost:5173 to call the API

    # Ensure DB indexes exist
    from db import ensure_indexes
    ensure_indexes()

    # Register blueprints
    from api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api/v1")

    from api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/v1")

    return app
