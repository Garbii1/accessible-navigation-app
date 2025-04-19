# backend/app.py
import os
from flask import Flask, jsonify, g # Import g for auth context
from dotenv import load_dotenv
from flask_cors import CORS
from pymongo import MongoClient
import logging

# --- Load Environment Variables ---
load_dotenv()

# --- Initialize Flask App ---
app = Flask(__name__)

# --- Configure Logging ---
logging.basicConfig(level=logging.INFO)
if os.getenv("FLASK_DEBUG", "False").lower() == "true":
    logging.getLogger().setLevel(logging.DEBUG)
    app.logger.info("Flask DEBUG mode is ON")
else:
     app.logger.info("Flask DEBUG mode is OFF")


# --- CORS Configuration ---
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
# Allow credentials if needed for Clerk cookies/sessions later
CORS(app, resources={r"/api/*": {"origins": [frontend_url]}}, supports_credentials=True)
app.logger.info(f"CORS enabled for origin: {frontend_url}")


# --- Database Setup (MongoDB Atlas) ---
MONGO_URI = os.getenv("MONGO_URI")
db = None
client = None

if not MONGO_URI:
    app.logger.warning("MONGO_URI environment variable not set. Database functionality disabled.")
else:
    try:
        client = MongoClient(MONGO_URI, connectTimeoutMS=5000, serverSelectionTimeoutMS=5000)
        client.admin.command('ping') # Verify connection early
        db = client.accessible_nav_db
        app.logger.info("Successfully connected to MongoDB Atlas!")

        # --- Ensure Indexes ---
        index_info = db.accessibility_points.index_information()
        if "location_2dsphere" not in index_info:
             app.logger.info("Creating location_2dsphere index on accessibility_points...")
             db.accessibility_points.create_index([("location", "2dsphere")], name="location_2dsphere")

        index_info = db.routes.index_information()
        if "routes_userId_1" not in index_info:
            app.logger.info("Creating userId index on routes...")
            db.routes.create_index([("userId", 1)], name="routes_userId_1")

        index_info = db.users.index_information()
        # Use unique=True only if you are managing user creation solely through Clerk webhooks or similar
        # If creating user docs on first preference save, don't make it unique initially
        is_unique = False # Set to True if userId MUST be unique (requires careful user creation flow)
        if "users_userId_1" not in index_info:
            app.logger.info(f"Creating userId index on users (unique={is_unique})...")
            db.users.create_index([("userId", 1)], name="users_userId_1", unique=is_unique)

    except Exception as e:
        app.logger.error(f"CRITICAL: Error connecting to MongoDB or creating indexes: {e}", exc_info=True)
        db = None
        client = None


# --- Make DB accessible to Blueprints ---
# Simple approach: Assign to app context config
app.config['MONGO_DB'] = db
app.config['MONGO_CLIENT'] = client # Might be needed sometimes

# --- Import and Register Blueprints ---
# Ensure these imports work relative to the app.py location
try:
    from api.routes_navigation import nav_bp
    from api.routes_userdata import userdata_bp
    from api.routes_accessibility import accessibility_bp

    app.register_blueprint(nav_bp)
    app.register_blueprint(userdata_bp)
    app.register_blueprint(accessibility_bp)
    app.logger.info("Registered API blueprints.")
except Exception as e:
     app.logger.error(f"An unexpected error occurred during blueprint registration: {e}", exc_info=True)


# --- Base Route ---
@app.route('/')
def index():
    """Base route providing a welcome message."""
    return jsonify({"message": "Welcome to the Accessible Navigation API! Status: OK"})


# --- Global Error Handlers ---
@app.errorhandler(404)
def not_found_error(error):
    app.logger.warning(f"404 Not Found: {request.path} - {error}")
    return jsonify({"error": "Not Found", "message": "The requested resource was not found."}), 404

@app.errorhandler(401)
def unauthorized_error(error):
    app.logger.warning(f"401 Unauthorized: {request.path} - {error}")
    return jsonify({"error": "Unauthorized", "message": "Authentication is required and has failed or has not yet been provided."}), 401

@app.errorhandler(403)
def forbidden_error(error):
     app.logger.warning(f"403 Forbidden: {request.path} - {error}")
     return jsonify({"error": "Forbidden", "message": "You do not have permission to access this resource."}), 403

# Add handlers for other common errors like 400 Bad Request if needed
@app.errorhandler(400)
def bad_request_error(error):
     app.logger.warning(f"400 Bad Request: {request.path} - {error}")
     # error often has a description attribute from Flask/Werkzeug
     message = getattr(error, 'description', 'The browser (or proxy) sent a request that this server could not understand.')
     return jsonify({"error": "Bad Request", "message": message}), 400

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal Server Error: {request.path} - {error}", exc_info=True)
    return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred on the server."}), 500

@app.errorhandler(Exception)
def handle_generic_exception(error):
    # Catch-all for any other exceptions not handled specifically
    app.logger.error(f"Unhandled Exception: {request.path} - {error}", exc_info=True)
    # Avoid exposing internal details in production
    if app.debug:
         return jsonify({"error": "Unhandled Exception", "message": str(error)}), 500
    else:
         return jsonify({"error": "Server Error", "message": "An unexpected application error occurred."}), 500


# --- Main Execution (for local development via 'python app.py') ---
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.logger.info(f"Starting Flask dev server on host 0.0.0.0, port {port}, debug={debug_mode}")
    # Use threaded=False if debugging causes issues with some libraries
    app.run(host='0.0.0.0', port=port, debug=debug_mode, threaded=True)