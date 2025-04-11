# Note: To use this Blueprint, you would import and register it in backend/app.py
# and remove the original user/routes endpoints from app.py.

from flask import Blueprint, jsonify, request
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
# --- Dependencies that would likely be needed ---
# from ..app import db # Example: Import from main app context (adjust based on structure)
# from ..utils.auth import get_current_user_id # Import auth helper

# Using placeholder imports/variables for demonstration
db = None # Placeholder
def get_current_user_id(): return "temp_user_id_for_testing" # Placeholder

# Create Blueprint
userdata_bp = Blueprint('userdata_api', __name__, url_prefix='/api')

# === Routes CRUD ===

@userdata_bp.route('/routes', methods=['POST'])
def save_route_blueprint():
    """(Blueprint Version) Saves a calculated route for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    data = request.get_json()
    if not data: return jsonify({"error": "Request body required"}), 400

    # Validation as in app.py
    route_name = data.get('name')
    origin = data.get('origin')
    destination = data.get('destination')
    google_route_data = data.get('googleRouteData')
    if not all([route_name, origin, destination, google_route_data]):
        return jsonify({"error": "Missing required route data"}), 400

    try:
        route_doc = {
            "userId": user_id, "name": route_name, "origin": origin,
            "destination": destination, "googleRouteData": google_route_data,
            "customWarnings": data.get("customWarnings", []), "createdAt": datetime.utcnow()
        }
        result = db.routes.insert_one(route_doc)
        return jsonify({"message": "Route saved successfully", "routeId": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error saving route (Blueprint): {e}")
        return jsonify({"error": "Failed to save route"}), 500

@userdata_bp.route('/routes', methods=['GET'])
def get_saved_routes_blueprint():
    """(Blueprint Version) Retrieves saved routes (summary) for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    try:
        user_routes = list(db.routes.find(
            {"userId": user_id},
            {"name": 1, "origin.address": 1, "destination.address": 1, "createdAt": 1}
        ).sort("createdAt", -1))
        for route in user_routes: route['_id'] = str(route['_id'])
        return jsonify(user_routes)
    except Exception as e:
        print(f"Error fetching routes (Blueprint): {e}")
        return jsonify({"error": "Failed to fetch saved routes"}), 500

@userdata_bp.route('/routes/<route_id>', methods=['GET'])
def get_single_route_blueprint(route_id):
    """(Blueprint Version) Retrieves full details for a specific saved route."""
    user_id = get_current_user_id()
    # ... (Auth & DB checks) ...
    try:
        obj_id = ObjectId(route_id)
        route = db.routes.find_one({"_id": obj_id, "userId": user_id})
        if route:
            route['_id'] = str(route['_id'])
            return jsonify(route)
        else:
            return jsonify({"error": "Route not found or access denied"}), 404
    except InvalidId:
        return jsonify({"error": "Invalid route ID format"}), 400
    except Exception as e:
        print(f"Error fetching single route (Blueprint): {e}")
        return jsonify({"error": "Failed to fetch route details"}), 500

@userdata_bp.route('/routes/<route_id>', methods=['DELETE'])
def delete_route_blueprint(route_id):
    """(Blueprint Version) Deletes a specific saved route."""
    user_id = get_current_user_id()
    # ... (Auth & DB checks) ...
    try:
        obj_id = ObjectId(route_id)
        result = db.routes.delete_one({"_id": obj_id, "userId": user_id})
        if result.deleted_count == 1:
            return jsonify({"message": "Route deleted successfully"}), 200
        else:
            return jsonify({"error": "Route not found or access denied"}), 404
    except InvalidId:
        return jsonify({"error": "Invalid route ID format"}), 400
    except Exception as e:
        print(f"Error deleting route (Blueprint): {e}")
        return jsonify({"error": "Failed to delete route"}), 500

# === User Preferences ===

@userdata_bp.route('/user/preferences', methods=['GET'])
def get_user_preferences_blueprint():
    """(Blueprint Version) Retrieves preferences for the authenticated user."""
    user_id = get_current_user_id()
    # ... (Auth & DB checks) ...
    try:
        user_data = db.users.find_one({"userId": user_id}, {"preferences": 1, "_id": 0})
        if user_data and 'preferences' in user_data:
            return jsonify(user_data['preferences'])
        else:
            return jsonify({"defaultMobility": "standard", "voiceURI": None}) # Defaults
    except Exception as e:
        print(f"Error fetching preferences (Blueprint): {e}")
        return jsonify({"error": "Failed to fetch user preferences"}), 500

@userdata_bp.route('/user/preferences', methods=['PUT'])
def update_user_preferences_blueprint():
    """(Blueprint Version) Updates preferences for the authenticated user."""
    user_id = get_current_user_id()
    # ... (Auth & DB checks) ...
    data = request.get_json()
    if not data: return jsonify({"error": "Request body required"}), 400

    # Validation as in app.py
    allowed_mobility = ['standard', 'wheelchair']
    prefs_to_update = {}
    valid_update = False
    if 'defaultMobility' in data:
        if data['defaultMobility'] not in allowed_mobility: return jsonify({"error": "Invalid defaultMobility"}), 400
        prefs_to_update['preferences.defaultMobility'] = data['defaultMobility']
        valid_update = True
    if 'voiceURI' in data:
        if data['voiceURI'] is not None and not isinstance(data['voiceURI'], str): return jsonify({"error": "Invalid voiceURI"}), 400
        prefs_to_update['preferences.voiceURI'] = data['voiceURI']
        valid_update = True

    if not valid_update: return jsonify({"error": "No valid preference fields provided"}), 400

    try:
        # Using upsert=True to handle potential initial creation
        db.users.update_one(
            {"userId": user_id}, {"$set": prefs_to_update}, upsert=True
        )
        updated_user = db.users.find_one({"userId": user_id}, {"preferences": 1, "_id": 0})
        return jsonify(updated_user.get('preferences', {}))
    except Exception as e:
        print(f"Error updating preferences (Blueprint): {e}")
        return jsonify({"error": "Failed to update user preferences"}), 500