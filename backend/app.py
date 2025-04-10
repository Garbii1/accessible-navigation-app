# backend/app.py
import os
import requests
import polyline # For decoding Google polylines
import math # Potentially for distance calculations
from flask import Flask, jsonify, request, g # Added g for potential future auth context
from dotenv import load_dotenv
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta # Added timedelta for cache TTL example

# Load environment variables from .env file
load_dotenv()

# --- Flask App Initialization ---
app = Flask(__name__)

# --- CORS Configuration ---
# Allow requests only from the frontend URL specified in env var
# Defaults to localhost:5173 for local development
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS(app, resources={r"/api/*": {"origins": [frontend_url]}})
print(f"CORS enabled for origin: {frontend_url}") # Log the CORS origin

# --- Database Setup (MongoDB Atlas) ---
MONGO_URI = os.getenv("MONGO_URI")
db = None # Initialize db to None
client = None # Initialize client to None

if not MONGO_URI:
    print("Warning: MONGO_URI environment variable not set. Database functionality disabled.")
else:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000) # Add timeout
        db = client.accessible_nav_db # Choose your database name
        # Test connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB Atlas!")

        # --- Create Indexes (Important for performance - idempotent) ---
        print("Ensuring database indexes...")
        # Geospatial index for accessibility points
        db.accessibility_points.create_index([("location", "2dsphere")], name="location_2dsphere")
        # Index user ID for faster route lookups
        db.routes.create_index([("userId", 1)], name="routes_userId_1")
        # Index user ID for faster preference lookups (using placeholder name)
        db.users.create_index([("userId", 1)], name="users_userId_1")
        print("Database indexes ensured.")

    except Exception as e:
        print(f"Error connecting to MongoDB or creating indexes: {e}")
        db = None # Ensure db is None if connection failed
        client = None


# --- Google Maps API Setup ---
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not GOOGLE_MAPS_API_KEY:
     print("Warning: GOOGLE_MAPS_API_KEY environment variable not set. Route calculation disabled.")


# --- Simple In-Memory Cache for Routes ---
# Note: This cache is lost on server restart/deploy.
# Consider Redis or MongoDB TTL collections for more persistent caching.
route_cache = {}
MAX_CACHE_SIZE = 100 # Limit cache size for free tier memory

def clean_cache():
    """Removes oldest items if cache exceeds max size (simple FIFO)."""
    if len(route_cache) > MAX_CACHE_SIZE:
        num_to_remove = len(route_cache) - MAX_CACHE_SIZE
        keys_to_remove = list(route_cache.keys())[:num_to_remove]
        for key in keys_to_remove:
            route_cache.pop(key, None)
        print(f"Cache cleaned. Removed {num_to_remove} items.")


# --- Placeholder Helper Functions ---

def decode_google_polyline(encoded_polyline):
    """Decodes a Google Maps encoded polyline string into list of (lat, lng) tuples."""
    if not encoded_polyline:
        return []
    try:
        # polyline library returns [(lat, lng), ...]
        return polyline.decode(encoded_polyline)
    except Exception as e:
        print(f"Error decoding polyline: {e}")
        return []

def find_nearby_accessibility_issues(route_points_decoded, radius_meters=25):
    """ Finds accessibility points near a list of route coordinates from MongoDB """
    if not db or not route_points_decoded: return []

    # Reduce density of points to check for performance if route is long
    step = max(1, len(route_points_decoded) // 100) # Check approx 100 points along route
    points_to_check = route_points_decoded[::step]

    found_issues = []
    unique_issue_ids = set()

    for point in points_to_check:
        # MongoDB $nearSphere requires coordinates in [lng, lat] order
        query_point = [point[1], point[0]]
        query = {
            "location": {
                "$nearSphere": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": query_point
                    },
                    "$maxDistance": radius_meters
                }
            },
            # Optional: Filter for specific types or verified status
            # "status": "verified"
        }
        try:
            # Limit fields returned for efficiency
            issues = list(db.accessibility_points.find(query, {"_id": 1, "type": 1, "description": 1, "location": 1}))
            for issue in issues:
                 # Add unique issues
                 issue_id_str = str(issue['_id'])
                 if issue_id_str not in unique_issue_ids:
                     issue['_id'] = issue_id_str # Convert ObjectId for JSON
                     # Add lat/lng for easier frontend use if needed
                     issue['lat'] = issue['location']['coordinates'][1]
                     issue['lng'] = issue['location']['coordinates'][0]
                     # del issue['location'] # Optionally remove original GeoJSON
                     found_issues.append(issue)
                     unique_issue_ids.add(issue_id_str)
        except Exception as e:
            print(f"Error querying accessibility points near {query_point}: {e}")

    print(f"Found {len(found_issues)} unique accessibility issues near route.")
    return found_issues


# --- Utility for Placeholder Auth ---
def get_current_user_id():
    """Placeholder: Replace with actual authentication logic."""
    # return getattr(g, 'user_id', None) # Example if using Flask 'g'
    return "temp_user_id_for_testing" # <<< REPLACE WITH REAL AUTH


# ===========================================
#             API Endpoints
# ===========================================

# --- Base Route ---
@app.route('/')
def index():
    """Base route providing a welcome message."""
    return jsonify({"message": "Welcome to the Accessible Navigation API!"})


# --- Route Calculation Endpoint ---
@app.route('/api/route', methods=['POST'])
def get_route():
    """Calculates a route using Google Directions API, checks cache, and supplements with custom data."""
    if not GOOGLE_MAPS_API_KEY:
         return jsonify({"error": "Server configuration error: Missing Google API Key"}), 503 # Service Unavailable
    if not db:
        print("Warning: Route calculation attempted but database unavailable.")
        # Proceed without custom data, or return error? Depends on requirements.
        # return jsonify({"error": "Server configuration error: Database not available"}), 503

    data = request.get_json()
    origin = data.get('origin') # Expecting {lat: number, lng: number} or address string
    destination = data.get('destination')
    preferences = data.get('preferences', {})
    avoid_stairs = preferences.get('avoidStairs', True)
    wheelchair_accessible_transit = preferences.get('wheelchairAccessibleTransit', True)
    preferred_mode = preferences.get('mode', 'walking') # Allow mode selection ('walking', 'transit', 'driving')

    if not origin or not destination:
        return jsonify({"error": "Origin and destination are required"}), 400

    # --- Cache Check ---
    cache_key = f"{origin}_{destination}_{avoid_stairs}_{wheelchair_accessible_transit}_{preferred_mode}"
    if cache_key in route_cache:
         print(f"Returning cached route for key: {cache_key}")
         # Optionally add custom warnings even to cached routes if needed
         cached_data = route_cache[cache_key]
         # Example: Re-query custom data if it might have changed
         # overview_polyline = cached_data.get('routes', [{}])[0].get('overview_polyline', {}).get('points')
         # decoded_points = decode_google_polyline(overview_polyline)
         # custom_warnings = find_nearby_accessibility_issues(decoded_points)
         # cached_data['custom_accessibility_warnings'] = custom_warnings
         return jsonify(cached_data)

    # --- Call Google Directions API ---
    # Ensure origin/destination are formatted correctly
    origin_param = f"{origin['lat']},{origin['lng']}" if isinstance(origin, dict) else origin
    destination_param = f"{destination['lat']},{destination['lng']}" if isinstance(destination, dict) else destination

    params = {
        'origin': origin_param,
        'destination': destination_param,
        'key': GOOGLE_MAPS_API_KEY,
        'mode': preferred_mode,
        # 'alternatives': 'true', # Request alternative routes if needed
    }

    # Apply accessibility parameters based on mode
    if params['mode'] == 'walking' and avoid_stairs:
         params['avoid'] = 'stairs' # Note: Google's support for this varies by region
    elif params['mode'] == 'transit' and wheelchair_accessible_transit:
         params['transit_mode'] = 'wheelchair' # Specifically requests WC-accessible transit

    api_url = "https://maps.googleapis.com/maps/api/directions/json"
    print(f"Requesting Google Directions: {params}")

    try:
        response = requests.get(api_url, params=params, timeout=10) # Add timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        route_data = response.json()

        if route_data['status'] != 'OK':
            print(f"Google Directions API Error: {route_data['status']} - {route_data.get('error_message', '')}")
            # Avoid caching errors unless specific ones like ZERO_RESULTS
            if route_data['status'] == 'ZERO_RESULTS':
                return jsonify({"error": "No route found matching criteria.", "status": route_data['status']}), 404
            else:
                # Log the detailed error from Google if available
                error_detail = route_data.get('error_message', 'Unknown Google API error')
                return jsonify({"error": f"Failed to calculate route. Google status: {route_data['status']}", "detail": error_detail}), 502 # Bad Gateway

        # --- Supplement with Custom Accessibility Data ---
        custom_warnings = []
        if db and route_data.get('routes'):
            # Get the primary route's overview polyline
            overview_polyline = route_data['routes'][0].get('overview_polyline', {}).get('points')
            if overview_polyline:
                decoded_points = decode_google_polyline(overview_polyline)
                if decoded_points:
                    custom_warnings = find_nearby_accessibility_issues(decoded_points)

        # Add custom warnings to the response object
        route_data['custom_accessibility_warnings'] = custom_warnings

        # --- Cache the successful result ---
        clean_cache() # Ensure cache doesn't exceed max size
        route_cache[cache_key] = route_data
        print(f"Calculated and cached route. Cache size: {len(route_cache)}")

        return jsonify(route_data)

    except requests.exceptions.Timeout:
        print("Error: Google Maps API request timed out.")
        return jsonify({"error": "Routing service request timed out"}), 504 # Gateway Timeout
    except requests.exceptions.RequestException as e:
        print(f"Error calling Google Maps API: {e}")
        return jsonify({"error": "Could not connect to routing service"}), 503 # Service Unavailable
    except Exception as e:
        app.logger.error(f"An unexpected error occurred during route calculation: {e}", exc_info=True)
        return jsonify({"error": "Internal server error during route calculation"}), 500


# --- Routes CRUD Endpoints ---

@app.route('/api/routes', methods=['POST'])
def save_route():
    """Saves a calculated route for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    data = request.get_json()
    if not data: return jsonify({"error": "Request body required"}), 400

    route_name = data.get('name')
    origin = data.get('origin')
    destination = data.get('destination')
    google_route_data = data.get('googleRouteData')
    custom_warnings = data.get("customWarnings", [])

    # Basic Validation
    if not all([route_name, origin, destination, google_route_data]):
         return jsonify({"error": "Missing required fields (name, origin, destination, googleRouteData)"}), 400
    if not isinstance(origin, dict) or 'lat' not in origin or 'lng' not in origin or \
       not isinstance(destination, dict) or 'lat' not in destination or 'lng' not in destination:
         return jsonify({"error": "Origin and Destination must be objects with lat, lng"}), 400

    try:
         route_doc = {
             "userId": user_id,
             "name": route_name,
             "origin": origin,
             "destination": destination,
             "googleRouteData": google_route_data, # Consider pruning this if too large
             "customWarnings": custom_warnings,
             "createdAt": datetime.utcnow()
         }
         result = db.routes.insert_one(route_doc)
         return jsonify({"message": "Route saved successfully", "routeId": str(result.inserted_id)}), 201
    except Exception as e:
         app.logger.error(f"Error saving route for user {user_id}: {e}", exc_info=True)
         return jsonify({"error": "Failed to save route due to server error"}), 500

@app.route('/api/routes', methods=['GET'])
def get_saved_routes():
    """Retrieves saved routes (summary) for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    try:
        user_routes = list(db.routes.find(
            {"userId": user_id},
            # Project only necessary fields for the list view
            {"name": 1, "origin.address": 1, "destination.address": 1, "createdAt": 1}
          ).sort("createdAt", -1)) # Sort by newest first

        for route in user_routes:
            route['_id'] = str(route['_id']) # Convert ObjectId
        return jsonify(user_routes)
    except Exception as e:
        app.logger.error(f"Error fetching routes for user {user_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch saved routes"}), 500

@app.route('/api/routes/<route_id>', methods=['GET'])
def get_single_route(route_id):
    """Retrieves full details for a specific saved route."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    try:
        obj_id = ObjectId(route_id)
    except InvalidId:
        return jsonify({"error": "Invalid route ID format"}), 400

    try:
        route = db.routes.find_one({"_id": obj_id, "userId": user_id})
        if route:
            route['_id'] = str(route['_id'])
            return jsonify(route)
        else:
            return jsonify({"error": "Route not found or access denied"}), 404
    except Exception as e:
        app.logger.error(f"Error fetching route {route_id} for user {user_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch route details"}), 500

@app.route('/api/routes/<route_id>', methods=['DELETE'])
def delete_route(route_id):
    """Deletes a specific saved route."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    try:
        obj_id = ObjectId(route_id)
    except InvalidId:
        return jsonify({"error": "Invalid route ID format"}), 400

    try:
        result = db.routes.delete_one({"_id": obj_id, "userId": user_id})
        if result.deleted_count == 1:
            return jsonify({"message": "Route deleted successfully"}), 200
        else:
            return jsonify({"error": "Route not found or access denied"}), 404
    except Exception as e:
        app.logger.error(f"Error deleting route {route_id} for user {user_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete route"}), 500


# --- User Preferences Endpoints ---

@app.route('/api/user/preferences', methods=['GET'])
def get_user_preferences():
    """Retrieves preferences for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    try:
        # Assume 'users' collection exists and uses 'userId' field
        user_data = db.users.find_one({"userId": user_id}, {"preferences": 1, "_id": 0})
        if user_data and 'preferences' in user_data:
            return jsonify(user_data['preferences'])
        else:
            # Return default preferences if not found
            return jsonify({"defaultMobility": "standard", "voiceURI": None})
    except Exception as e:
        app.logger.error(f"Error fetching preferences for user {user_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch user preferences"}), 500

@app.route('/api/user/preferences', methods=['PUT'])
def update_user_preferences():
    """Updates preferences for the authenticated user."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    data = request.get_json()
    if not data: return jsonify({"error": "Request body required"}), 400

    allowed_mobility = ['standard', 'wheelchair']
    prefs_to_update = {}
    valid_update = False

    if 'defaultMobility' in data:
        if data['defaultMobility'] not in allowed_mobility:
            return jsonify({"error": f"Invalid defaultMobility. Allowed: {allowed_mobility}"}), 400
        prefs_to_update['preferences.defaultMobility'] = data['defaultMobility']
        valid_update = True

    if 'voiceURI' in data:
        if data['voiceURI'] is not None and not isinstance(data['voiceURI'], str):
            return jsonify({"error": "Invalid voiceURI. Must be a string or null."}), 400
        prefs_to_update['preferences.voiceURI'] = data['voiceURI']
        valid_update = True

    if not valid_update:
        return jsonify({"error": "No valid preference fields provided for update"}), 400

    try:
        # Use $set with dot notation to update specific fields in the subdocument
        # Use upsert=True to create the user document/preferences field if it doesn't exist
        result = db.users.update_one(
            {"userId": user_id},
            {"$set": prefs_to_update},
            upsert=True # Creates user doc and preferences field if missing
        )

        # Fetch and return the updated preferences
        updated_user = db.users.find_one({"userId": user_id}, {"preferences": 1, "_id": 0})
        return jsonify(updated_user.get('preferences', {}))

    except Exception as e:
        app.logger.error(f"Error updating preferences for user {user_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to update user preferences"}), 500


# --- Accessibility Points CRUD Endpoints ---

@app.route('/api/accessibility-points', methods=['POST'])
def add_accessibility_point():
    """Adds a new accessibility point (requires auth)."""
    user_id = get_current_user_id()
    if not user_id: return jsonify({"error": "Authentication required"}), 401
    # TODO: Add role check if needed
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    data = request.get_json()
    if not data: return jsonify({"error": "Request body required"}), 400

    lat = data.get('lat')
    lng = data.get('lng')
    point_type = data.get('type')
    description = data.get('description', '')

    if lat is None or lng is None or not point_type:
        return jsonify({"error": "Missing required fields: lat, lng, type"}), 400

    try:
        lat = float(lat); lng = float(lng)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates: lat and lng must be numbers"}), 400

    allowed_types = ['ramp', 'elevator', 'hazard', 'accessible_restroom', 'missing_curb_cut', 'step_free_entrance']
    if point_type not in allowed_types:
        return jsonify({"error": f"Invalid type. Allowed: {', '.join(allowed_types)}"}), 400

    try:
        point_doc = {
            "location": {"type": "Point", "coordinates": [lng, lat]},
            "type": point_type,
            "description": description,
            "imageUrl": data.get('imageUrl'),
            "source": data.get('source', 'user_submitted'),
            "status": 'unverified', # New submissions start as unverified
            "submittedBy": user_id,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = db.accessibility_points.insert_one(point_doc)
        # Return the created point ID and message
        return jsonify({"message": "Accessibility point added successfully", "pointId": str(result.inserted_id)}), 201
    except Exception as e:
        app.logger.error(f"Error adding accessibility point submitted by {user_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to add accessibility point"}), 500

@app.route('/api/accessibility-points', methods=['GET'])
def get_accessibility_points():
    """Retrieves accessibility points near a given location (public)."""
    # Note: Decided to make this public for easier map display without login
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
        radius = int(request.args.get('radius', '500')) # Default radius 500m
    except (TypeError, ValueError, AttributeError):
        return jsonify({"error": "Missing or invalid required query parameters: lat (number), lng (number)"}), 400

    point_type_filter = request.args.get('type')

    try:
        query = {
            "location": {
                "$nearSphere": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": radius
                }
            },
            # Only show verified points on the public map?
            # "status": "verified"
        }
        if point_type_filter:
            query["type"] = point_type_filter

        # Project fields needed for map display
        projection = {"_id": 1, "type": 1, "description": 1, "location.coordinates": 1}
        points = list(db.accessibility_points.find(query, projection).limit(200)) # Limit results

        # Format for easier frontend consumption
        formatted_points = []
        for point in points:
            formatted_points.append({
                "id": str(point['_id']),
                "type": point.get("type"),
                "description": point.get("description"),
                "lat": point.get("location", {}).get("coordinates", [None, None])[1],
                "lng": point.get("location", {}).get("coordinates", [None, None])[0],
            })

        return jsonify(formatted_points)
    except Exception as e:
        app.logger.error(f"Error fetching accessibility points near ({lat}, {lng}): {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch accessibility points"}), 500

@app.route('/api/accessibility-points/<point_id>', methods=['GET'])
def get_single_accessibility_point(point_id):
    """Retrieves details for a single accessibility point (public)."""
    if not db: return jsonify({"error": "Database service unavailable"}), 503

    try:
        obj_id = ObjectId(point_id)
    except InvalidId:
        return jsonify({"error": "Invalid point ID format"}), 400

    try:
        # Project fields, potentially excluding submitter info for public view
        projection = {"submittedBy": 0}
        point = db.accessibility_points.find_one({"_id": obj_id}, projection)
        if point:
            point['_id'] = str(point['_id']) # Convert ObjectId
            return jsonify(point)
        else:
            return jsonify({"error": "Accessibility point not found"}), 404
    except Exception as e:
        app.logger.error(f"Error fetching accessibility point {point_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch accessibility point details"}), 500


# ===========================================
#             Error Handlers
# ===========================================

@app.errorhandler(404)
def not_found_error(error):
    """Handles 404 Not Found errors."""
    return jsonify({"error": "Not Found", "message": "The requested URL was not found on the server."}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handles 500 Internal Server errors."""
    # Log the actual error to the server logs
    app.logger.error(f"Internal Server Error: {error}", exc_info=True)
    return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred."}), 500

@app.errorhandler(Exception)
def handle_generic_exception(error):
    """Handles any other unhandled exceptions."""
    # Log the actual error
    app.logger.error(f"Unhandled Exception: {error}", exc_info=True)
    return jsonify({"error": "Server Error", "message": "An unexpected application error occurred."}), 500


# ===========================================
#             Main Execution
# ===========================================

if __name__ == '__main__':
    # Get port from environment variable or default to 5001 for local dev
    port = int(os.environ.get('PORT', 5001))
    # Get debug mode from environment variable (defaults to False)
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    print(f"Starting Flask server on host 0.0.0.0, port {port}, debug={debug_mode}")
    # Run the Flask development server
    # Gunicorn will be used in production via Procfile, this is for local 'python app.py'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)