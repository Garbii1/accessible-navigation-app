import os
import requests

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json"
GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json"

def fetch_google_directions(params):
    """
    Fetches directions from the Google Directions API.
    Args:
        params (dict): Dictionary of parameters for the API call
                       (origin, destination, key, mode, avoid, transit_mode etc.).
    Returns:
        dict: The JSON response from Google.
    Raises:
        requests.exceptions.RequestException: If the request fails.
        ValueError: If the API returns a non-OK status.
    """
    if not GOOGLE_MAPS_API_KEY:
        raise ValueError("Missing Google Maps API Key environment variable.")

    # Ensure the key is in the params sent to Google
    params['key'] = GOOGLE_MAPS_API_KEY

    try:
        response = requests.get(DIRECTIONS_API_URL, params=params, timeout=10)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        if data['status'] != 'OK':
            error_msg = data.get('error_message', f"Google Directions API status: {data['status']}")
            # Consider logging the full error details here
            print(f"Google Directions API Error: {error_msg}")
            raise ValueError(error_msg) # Raise a value error for non-OK status

        return data

    except requests.exceptions.Timeout:
        print("Error: Google Maps API request timed out.")
        raise requests.exceptions.Timeout("Routing service request timed out")
    except requests.exceptions.RequestException as e:
        print(f"Error calling Google Maps API: {e}")
        raise requests.exceptions.RequestException(f"Could not connect to routing service: {e}")
    except Exception as e:
         # Catch any other unexpected errors
        print(f"Unexpected error in fetch_google_directions: {e}")
        raise Exception(f"Unexpected error processing Google Directions request: {e}")


# Example: Placeholder for Geocoding Service function
def geocode_address(address):
    """
    (Placeholder) Converts an address string to lat/lng coordinates using Google Geocoding API.
    """
    if not GOOGLE_MAPS_API_KEY:
        raise ValueError("Missing Google Maps API Key environment variable.")

    params = {'address': address, 'key': GOOGLE_MAPS_API_KEY}
    try:
        response = requests.get(GEOCODING_API_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data['status'] == 'OK' and data.get('results'):
            location = data['results'][0]['geometry']['location'] # lat, lng
            return location
        else:
            print(f"Geocoding failed for '{address}'. Status: {data['status']}")
            return None
    except Exception as e:
        print(f"Error during geocoding for '{address}': {e}")
        return None