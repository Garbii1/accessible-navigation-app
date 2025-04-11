# Note: This requires access to the 'db' object, often initialized in app.py.
# How 'db' is passed here depends on your application structure (e.g., global, app context, dependency injection).
# For simplicity, this example assumes 'db' can be imported or accessed globally.

# from ..app import db # Example import (adjust path)
from bson import ObjectId

db = None # Placeholder - needs to be initialized/passed correctly

def find_nearby_accessibility_issues(route_points_decoded, radius_meters=25):
    """ Finds accessibility points near a list of route coordinates from MongoDB """
    if not db or not route_points_decoded: return []

    # Reduce density of points to check for performance if route is long
    step = max(1, len(route_points_decoded) // 100) # Check approx 100 points
    points_to_check = route_points_decoded[::step]

    found_issues = []
    unique_issue_ids = set()

    for point in points_to_check:
        query_point = [point[1], point[0]] # GeoJSON: [lng, lat]
        query = {
            "location": {
                "$nearSphere": {
                    "$geometry": {"type": "Point", "coordinates": query_point},
                    "$maxDistance": radius_meters
                }
            },
            # "status": "verified" # Optional filter
        }
        try:
            projection = {"_id": 1, "type": 1, "description": 1, "location": 1}
            issues = list(db.accessibility_points.find(query, projection))
            for issue in issues:
                 issue_id_str = str(issue['_id'])
                 if issue_id_str not in unique_issue_ids:
                     issue['_id'] = issue_id_str
                     issue['lat'] = issue['location']['coordinates'][1]
                     issue['lng'] = issue['location']['coordinates'][0]
                     # del issue['location'] # Optional cleanup
                     found_issues.append(issue)
                     unique_issue_ids.add(issue_id_str)
        except Exception as e:
            print(f"Error querying accessibility points near {query_point} in service: {e}")

    print(f"Service found {len(found_issues)} unique accessibility issues near route.")
    return found_issues

# --- Placeholder Examples for other DB operations ---

def get_user_by_id(user_id):
    if not db: return None
    try:
        # Assuming your user documents have a 'userId' field matching the auth ID
        return db.users.find_one({"userId": user_id})
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        return None

def save_user_preferences(user_id, preferences):
    if not db: return False
    try:
        result = db.users.update_one(
            {"userId": user_id},
            {"$set": {"preferences": preferences}},
            upsert=True
        )
        return result.acknowledged
    except Exception as e:
        print(f"Error saving preferences for user {user_id}: {e}")
        return False