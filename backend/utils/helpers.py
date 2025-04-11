import polyline

def decode_google_polyline(encoded_polyline):
    """
    Decodes a Google Maps encoded polyline string into list of (lat, lng) tuples.
    Returns empty list on error or if input is None/empty.
    """
    if not encoded_polyline:
        return []
    try:
        # polyline library returns [(lat, lng), ...]
        decoded = polyline.decode(encoded_polyline)
        # Ensure coordinates are floats
        return [(float(lat), float(lng)) for lat, lng in decoded]
    except Exception as e:
        print(f"Error decoding polyline: {e}")
        return []

# Add other general helper functions here if needed
# e.g., def format_timestamp(ts): ...