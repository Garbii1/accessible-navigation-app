# Note: To use this Blueprint, you would import and register it in backend/app.py
# and remove the original '/api/route' definition from app.py.

import os
import requests
import polyline # Assuming polyline library is installed
from flask import Blueprint, jsonify, request
# --- Dependencies that would likely be needed ---
# from ..app import db, route_cache, clean_cache # Example: Import from main app context (adjust based on structure)
# from ..services.google_maps_service import fetch_google_directions
# from ..services.database_service import find_nearby_accessibility_issues
# from ..utils.helpers import decode_google_polyline

# Using placeholder imports/variables for demonstration
db = None # Placeholder
route_cache = {} # Placeholder
def clean_cache(): pass # Placeholder
def fetch_google_directions(params): return {"status": "OK", "routes": []} # Placeholder
def find_nearby_accessibility_issues(points): return [] # Placeholder
def decode_google_polyline(pline): return [] # Placeholder

# Create Blueprint
nav_bp = Blueprint('navigation_api', __name__, url_prefix='/api')

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

@nav_bp.route('/route', methods=['POST'])
def get_route_blueprint():
    """
    (Blueprint Version) Calculates a route using Google Directions API,
    checks cache, and supplements with custom data.
    """
    if not GOOGLE_MAPS_API_KEY:
         return jsonify({"error": "Server configuration error: Missing Google API Key"}), 503

    data = request.get_json()
    if not data: return jsonify({"error": "Request body required"}), 400

    origin = data.get('origin')
    destination = data.get('destination')
    preferences = data.get('preferences', {})
    avoid_stairs = preferences.get('avoidStairs', True)
    wheelchair_accessible_transit = preferences.get('wheelchairAccessibleTransit', True)
    preferred_mode = preferences.get('mode', 'walking')

    if not origin or not destination:
        return jsonify({"error": "Origin and destination are required"}), 400

    # --- Cache Check ---
    cache_key = f"{origin}_{destination}_{avoid_stairs}_{wheelchair_accessible_transit}_{preferred_mode}"
    if cache_key in route_cache:
         print(f"Returning cached route for key: {cache_key}")
         return jsonify(route_cache[cache_key])

    # --- Format Params and Call Google ---
    origin_param = f"{origin['lat']},{origin['lng']}" if isinstance(origin, dict) else origin
    destination_param = f"{destination['lat']},{destination['lng']}" if isinstance(destination, dict) else destination

    params = {
        'origin': origin_param,
        'destination': destination_param,
        'key': GOOGLE_MAPS_API_KEY,
        'mode': preferred_mode,
    }
    if params['mode'] == 'walking' and avoid_stairs: params['avoid'] = 'stairs'
    elif params['mode'] == 'transit' and wheelchair_accessible_transit: params['transit_mode'] = 'wheelchair'

    try:
        # --- Ideally use the service function ---
        # route_data = fetch_google_directions(params)
        # Using placeholder directly for now:
        api_url = "https://maps.googleapis.com/maps/api/directions/json"
        response = requests.get(api_url, params=params, timeout=10)
        response.raise_for_status()
        route_data = response.json()
        # --- End Placeholder ---

        if route_data['status'] != 'OK':
             # Handle Google API errors as in the main app.py version
            if route_data['status'] == 'ZERO_RESULTS':
                 return jsonify({"error": "No route found matching criteria.", "status": route_data['status']}), 404
            else:
                 error_detail = route_data.get('error_message', 'Unknown Google API error')
                 return jsonify({"error": f"Failed to calculate route. Google status: {route_data['status']}", "detail": error_detail}), 502

        # --- Supplement with Custom Data ---
        custom_warnings = []
        if db and route_data.get('routes'):
             overview_polyline = route_data['routes'][0].get('overview_polyline', {}).get('points')
             if overview_polyline:
                 decoded_points = decode_google_polyline(overview_polyline)
                 if decoded_points:
                     custom_warnings = find_nearby_accessibility_issues(decoded_points)
        route_data['custom_accessibility_warnings'] = custom_warnings

        # --- Cache Result ---
        clean_cache()
        route_cache[cache_key] = route_data
        print(f"Calculated and cached route (Blueprint). Cache size: {len(route_cache)}")

        return jsonify(route_data)

    except requests.exceptions.Timeout:
        print("Error: Google Maps API request timed out (Blueprint).")
        return jsonify({"error": "Routing service request timed out"}), 504
    except requests.exceptions.RequestException as e:
        print(f"Error calling Google Maps API (Blueprint): {e}")
        return jsonify({"error": "Could not connect to routing service"}), 503
    except Exception as e:
        # In a real app, use app logger: app.logger.error(...)
        print(f"An unexpected error occurred during route calculation (Blueprint): {e}")
        return jsonify({"error": "Internal server error during route calculation"}), 500