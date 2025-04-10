# backend/app.py
import os
from flask import Flask, jsonify, request, g # Added g for potential future auth context
from dotenv import load_dotenv
from flask_cors import CORS
import requests
from pymongo import MongoClient
from bson import ObjectId # Make sure this is imported
from bson.errors import InvalidId # Import for error handling
from datetime import datetime # Make sure this is imported
import polyline # If you're using the polyline decoding helper
import math # For distance calculations if needed

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [os.getenv("FRONTEND_URL", "http://localhost:5173")]}})

# --- Database Setup (Keep as is) ---
MONGO_URI = os.getenv("MONGO_URI")
# ... (rest of DB setup including indexes) ...
try:
    client = MongoClient(MONGO_URI)
    db = client.accessible_nav_db
    client.admin.command('ping')
    print("Successfully connected to MongoDB Atlas!")
    # Ensure indexes are created (idempotent operation)
    db.accessibility_points.create_index([("location", "2dsphere")])
    db.routes.create_index([("userId", 1)])
    # Consider adding index for users collection if querying by authId often
    # db.users.create_index([("authId", 1)], unique=True) # Example
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    client = None
    db = None

# --- Google Maps API Setup (Keep as is) ---
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
# ...

# --- Caching Setup (Keep as is) ---
route_cache = {}
MAX_CACHE_SIZE = 100
# ... (clean_cache function) ...

# --- Helper Functions (Keep as is or add more) ---
# ... (find_nearby_accessibility_issues, decode_polyline etc.) ...


# --- Utility for Placeholder Auth ---
# In a real app, this would be replaced by middleware that verifies a JWT token
# or session and sets g.user_id and potentially g.user_roles
def get_current_user_id():
    # Placeholder: Replace with actual authentication logic
    # For now, we return a static ID for testing purposes.
    # In production, you'd extract this from a verified session or token.
    # Example using Flask's 'g' object if set by middleware:
    # return getattr(g, 'user_id', None)
    return "temp_user_id_for_testing" # <<< REPLACE THIS WITH REAL AUTH

# --- Base Route (Keep as is) ---
@app.route('/')
def index():
    # ...
    return jsonify({"message": "Welcome to the Accessible Navigation API!"})
    pass # Keep existing code

# --- Route Calculation Endpoint (Keep as is) ---
@app.route('/api/route', methods=['POST'])
def get_route():
    # ...
    pass # Keep existing code


# --- Routes CRUD Endpoints ---

@app.route('/api/routes', methods=['POST'])
def save_route():
    # Requires Authentication implementation first
    user_id = get_current_user_id()
    if not user_id:
       return jsonify({"error": "Authentication required"}), 401

    if not db: return jsonify({"error": "Database not available"}), 500

    data = request.get_json()
    route_name = data.get('name')
    origin = data.get('origin') # Expected: {address: string, lat: float, lng: float}
    destination = data.get('destination') # Expected: {address: string, lat: float, lng: float}
    google_route_data = data.get('googleRouteData') # The JSON from Directions API
    custom_warnings = data.get("customWarnings", []) # Optional

    # Basic Validation
    if not all([route_name, origin, destination, google_route_data]):
         return jsonify({"error": "Missing required route data (name, origin, destination, googleRouteData)"}), 400
    if not isinstance(origin, dict) or not isinstance(destination, dict):
         return jsonify({"error": "Origin and Destination must be objects with address, lat, lng"}), 400

    try:
         # Consider storing only essential parts of googleRouteData if size is an issue
         # e.g., overview_polyline, legs[0].steps, distance, duration
         route_doc = {
             "userId": user_id,
             "name": route_name,
             "origin": origin,
             "destination": destination,
             "googleRouteData": google_route_data,
             "customWarnings": custom_warnings,
             "createdAt": datetime.utcnow()
         }
         result = db.routes.insert_one(route_doc)
         return jsonify({"message": "Route saved successfully", "routeId": str(result.inserted_id)}), 201

    except Exception as e:
         print(f"Error saving route: {e}")
         return jsonify({"error": "Failed to save route"}), 500

@app.route('/api/routes', methods=['GET'])
def get_saved_routes():
     # Requires Authentication
     user_id = get_current_user_id()
     if not user_id: return jsonify({"error": "Authentication required"}), 401

     if not db: return jsonify({"error": "Database not available"}), 500

     try:
          # Find routes for the user, exclude large data field for list view
          # Sort by creation date, newest first
          user_routes = list(db.routes.find(
              {"userId": user_id},
              {"googleRouteData": 0, "customWarnings": 0} # Exclude potentially large fields
            ).sort("createdAt", -1)) # Sort by newest first

          # Convert ObjectId to string for JSON serialization
          for route in user_routes:
              route['_id'] = str(route['_id'])
          return jsonify(user_routes)
     except Exception as e:
          print(f"Error fetching routes: {e}")
          return jsonify({"error": "Failed to fetch saved routes"}), 500

@app.route('/api/routes/<route_id>', methods=['GET'])
def get_single_route(route_id):
    # Requires Authentication
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401

    if not db: return jsonify({"error": "Database not available"}), 500

    try:
        obj_id = ObjectId(route_id)
    except InvalidId:
        return jsonify({"error": "Invalid route ID format"}), 400

    try:
        # Find the specific route only if it belongs to the current user
        route = db.routes.find_one({"_id": obj_id, "userId": user_id})

        if route:
            route['_id'] = str(route['_id']) # Convert ObjectId to string
            return jsonify(route)
        else:
            # Either route doesn't exist or doesn't belong to the user
            return jsonify({"error": "Route not found or access denied"}), 404
    except Exception as e:
        print(f"Error fetching single route: {e}")
        return jsonify({"error": "Failed to fetch route details"}), 500

@app.route('/api/routes/<route_id>', methods=['DELETE'])
def delete_route(route_id):
    # Requires Authentication
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401

    if not db: return jsonify({"error": "Database not available"}), 500

    try:
        obj_id = ObjectId(route_id)
    except InvalidId:
        return jsonify({"error": "Invalid route ID format"}), 400

    try:
        # Delete the route only if it belongs to the current user
        result = db.routes.delete_one({"_id": obj_id, "userId": user_id})

        if result.deleted_count == 1:
            return jsonify({"message": "Route deleted successfully"}), 200 # Or 204 No Content
        else:
            # Either route doesn't exist or doesn't belong to the user
            return jsonify({"error": "Route not found or access denied"}), 404
    except Exception as e:
        print(f"Error deleting route: {e}")
        return jsonify({"error": "Failed to delete route"}), 500


# --- User Preferences Endpoints ---

@app.route('/api/user/preferences', methods=['GET'])
def get_user_preferences():
    # Requires Authentication
    user_id = get_current_user_id() # This assumes you have a 'users' collection where user_id is the primary link
    if not user_id: return jsonify({"error": "Authentication required"}), 401

    if not db: return jsonify({"error": "Database not available"}), 500

    try:
        # Assuming user doc identified by the same user_id used in routes
        # Adjust field name if needed (e.g., authId instead of _id or userId)
        user_data = db.users.find_one({"userId": user_id}, {"preferences": 1, "_id": 0}) # Project only preferences

        if user_data and 'preferences' in user_data:
            return jsonify(user_data['preferences'])
        else:
            # Return default preferences if user/prefs don't exist
            return jsonify({
                "defaultMobility": "standard", # Or 'wheelchair' if that's your default
                "voiceURI": None # Or a default voice URI string
            })
    except Exception as e:
        print(f"Error fetching user preferences: {e}")
        return jsonify({"error": "Failed to fetch user preferences"}), 500

@app.route('/api/user/preferences', methods=['PUT'])
def update_user_preferences():
    # Requires Authentication
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401

    if not db: return jsonify({"error": "Database not available"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    # Validate incoming preferences (add more checks as needed)
    allowed_mobility = ['standard', 'wheelchair']
    new_prefs = {}
    if 'defaultMobility' in data:
        if data['defaultMobility'] not in allowed_mobility:
            return jsonify({"error": f"Invalid defaultMobility value. Allowed: {allowed_mobility}"}), 400
        new_prefs['defaultMobility'] = data['defaultMobility']
    if 'voiceURI' in data:
         # Basic check - could validate format further if needed
        if data['voiceURI'] is not None and not isinstance(data['voiceURI'], str):
            return jsonify({"error": "Invalid voiceURI value. Must be a string or null."}), 400
        new_prefs['voiceURI'] = data['voiceURI']

    if not new_prefs:
         return jsonify({"error": "No valid preference fields provided"}), 400

    try:
        # Update the preferences field within the user document.
        # Use upsert=True if you want to create the user document if it doesn't exist
        # (though user creation should typically happen at signup).
        result = db.users.update_one(
            {"userId": user_id}, # Filter: find the user document
            {"$set": {"preferences": new_prefs}}, # Update: set the preferences field
            upsert=False # Set to True ONLY if you want to create user doc here
        )

        if result.matched_count == 0 and result.upserted_id is None:
            # User document wasn't found and upsert was false or failed
             return jsonify({"error": "User not found to update preferences"}), 404

        # Return the updated preferences (optional, requires another find_one)
        updated_user = db.users.find_one({"userId": user_id}, {"preferences": 1, "_id": 0})
        return jsonify(updated_user.get('preferences', {}))

    except Exception as e:
        print(f"Error updating user preferences: {e}")
        return jsonify({"error": "Failed to update user preferences"}), 500

# --- Accessibility Points CRUD Endpoints ---

@app.route('/api/accessibility-points', methods=['POST'])
def add_accessibility_point():
    # Requires Authentication (and potentially authorization/roles)
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    # TODO: Add role check if only certain users can add points

    if not db: return jsonify({"error": "Database not available"}), 500

    data = request.get_json()
    if not data: return jsonify({"error": "Request body required"}), 400

    # Validate required fields
    lat = data.get('lat')
    lng = data.get('lng')
    point_type = data.get('type')
    description = data.get('description', '') # Optional description

    if lat is None or lng is None or not point_type:
        return jsonify({"error": "Missing required fields: lat, lng, type"}), 400

    try:
        # Validate coordinates are numbers
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates: lat and lng must be numbers"}), 400

    # TODO: Validate 'type' against a predefined list of allowed types
    allowed_types = ['ramp', 'elevator', 'hazard', 'accessible_restroom', 'missing_curb_cut', 'step_free_entrance']
    if point_type not in allowed_types:
         return jsonify({"error": f"Invalid type. Allowed types: {allowed_types}"}), 400

    try:
        point_doc = {
            "location": {
                "type": "Point",
                "coordinates": [lng, lat] # GeoJSON format: [longitude, latitude]
            },
            "type": point_type,
            "description": description,
            "imageUrl": data.get('imageUrl'), # Optional
            "source": data.get('source', 'user_submitted'), # Default source
            "status": data.get('status', 'unverified'), # Default status - requires verification flow
            "submittedBy": user_id,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        result = db.accessibility_points.insert_one(point_doc)
        return jsonify({"message": "Accessibility point added successfully", "pointId": str(result.inserted_id)}), 201

    except Exception as e:
        print(f"Error adding accessibility point: {e}")
        return jsonify({"error": "Failed to add accessibility point"}), 500

@app.route('/api/accessibility-points', methods=['GET'])
def get_accessibility_points():
    # Publicly accessible endpoint to find nearby points? Or require auth? Decide based on use case.
    if not db: return jsonify({"error": "Database not available"}), 500

    lat_str = request.args.get('lat')
    lng_str = request.args.get('lng')
    radius_str = request.args.get('radius', '500') # Default radius in meters
    point_type_filter = request.args.get('type') # Optional filter by type

    if not lat_str or not lng_str:
        return jsonify({"error": "Missing required query parameters: lat, lng"}), 400

    try:
        lat = float(lat_str)
        lng = float(lng_str)
        radius = int(radius_str)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid query parameters: lat, lng must be numbers, radius must be an integer"}), 400

    try:
        query = {
            "location": {
                "$nearSphere": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat] # GeoJSON: [lng, lat]
                    },
                    "$maxDistance": radius # Radius in meters
                }
            }
        }
        # Add optional type filter
        if point_type_filter:
            # TODO: Validate point_type_filter against allowed_types?
            query["type"] = point_type_filter

        # Only return verified points? Or filter by status? Add as needed:
        # query["status"] = "verified"

        # Limit number of results? Add .limit(X)
        points = list(db.accessibility_points.find(query, {"_id": 0})) # Exclude _id often not needed for map display

        # Note: _id was excluded above. If needed, uncomment the conversion loop.
        # for point in points:
        #     point['_id'] = str(point['_id'])

        return jsonify(points)

    except Exception as e:
        print(f"Error fetching accessibility points: {e}")
        return jsonify({"error": "Failed to fetch accessibility points"}), 500


@app.route('/api/accessibility-points/<point_id>', methods=['GET'])
def get_single_accessibility_point(point_id):
    # Public or authenticated? Decide based on use case.
    if not db: return jsonify({"error": "Database not available"}), 500

    try:
        obj_id = ObjectId(point_id)
    except InvalidId:
        return jsonify({"error": "Invalid point ID format"}), 400

    try:
        point = db.accessibility_points.find_one({"_id": obj_id})

        if point:
            point['_id'] = str(point['_id']) # Convert ObjectId to string
            # Convert location coordinates back if needed, though often frontend handles GeoJSON directly
            # point['lat'] = point['location']['coordinates'][1]
            # point['lng'] = point['location']['coordinates'][0]
            # del point['location'] # Remove original GeoJSON if sending lat/lng separately
            return jsonify(point)
        else:
            return jsonify({"error": "Accessibility point not found"}), 404
    except Exception as e:
        print(f"Error fetching single accessibility point: {e}")
        return jsonify({"error": "Failed to fetch accessibility point details"}), 500

# --- TODO: Add PUT and DELETE for /api/accessibility-points/<point_id> ---
# These would require stronger authorization checks (e.g., only admin or original submitter can modify/delete)
# Example Signature for PUT:
# @app.route('/api/accessibility-points/<point_id>', methods=['PUT'])
# def update_accessibility_point(point_id):
#     # Check auth/roles
#     # Get point_id, convert to ObjectId
#     # Get update data from request.json
#     # Validate data
#     # db.accessibility_points.update_one(...) with $set, update updatedAt timestamp
#     # Return updated point or success message

# Example Signature for DELETE:
# @app.route('/api/accessibility-points/<point_id>', methods=['DELETE'])
# def delete_accessibility_point(point_id):
#     # Check auth/roles
#     # Get point_id, convert to ObjectId
#     # db.accessibility_points.delete_one(...)
#     # Return success/no content or not found/forbidden


# --- Error Handling (Keep as is) ---
@app.errorhandler(404)
def not_found(error):
    # ...
    pass # Keep existing code

@app.errorhandler(500)
def server_error(error):
    # ...
    pass # Keep existing code

# --- Main Execution (Keep as is) ---
if __name__ == '__main__':
    # ...
    pass # Keep existing code