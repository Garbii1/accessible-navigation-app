// src/services/api.js

// Use environment variable for backend URL, fallback to relative path for proxy/same-origin setups
// Ensure VITE_API_BASE_URL is set in your .env files (e.g., http://localhost:5001 for dev, https://your-backend.onrender.com for prod)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// --- Helper for handling responses ---
// Reduces repetition in error handling
async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      // Try to parse error message from backend JSON response
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON or body is empty
      throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
    }
    // Throw error message from backend if available, otherwise generic HTTP error
    throw new Error(errorData?.error || `HTTP error! Status: ${response.status}`);
  }
  // Handle cases like 204 No Content where there might not be a body
  if (response.status === 204) {
     return null; // Or return true, depending on what the caller expects
  }
  // Otherwise, parse the JSON body
  return await response.json();
}

// --- Authentication Header (Placeholder) ---
// In a real app, you'd get the token from your auth state management (e.g., localStorage, context)
const getAuthHeader = () => {
    // const token = localStorage.getItem('authToken'); // Example: Retrieve token
    // if (token) {
    //     return { 'Authorization': `Bearer ${token}` };
    // }
    return {}; // Return empty object if no token
};

// --- Route Calculation ---
export const fetchRoute = async (origin, destination, preferences) => {
  try {
    const response = await fetch(`${API_BASE_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Auth header if route calculation requires login? (unlikely for this endpoint)
        // ...getAuthHeader(),
      },
      body: JSON.stringify({ origin, destination, preferences }),
    });
    return await handleResponse(response); // Use helper
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error; // Re-throw for component-level handling
  }
};

// --- Saved Routes CRUD ---

export const saveRoute = async (routeData) => {
  // routeData expected: { name, origin, destination, googleRouteData, customWarnings? }
  try {
    const response = await fetch(`${API_BASE_URL}/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Authentication likely required
      },
      body: JSON.stringify(routeData),
    });
    return await handleResponse(response); // Returns { message, routeId }
  } catch (error) {
    console.error("Error saving route:", error);
    throw error;
  }
};

export const getSavedRoutes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/routes`, {
      method: 'GET',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    return await handleResponse(response); // Returns array of route objects
  } catch (error) {
    console.error("Error fetching saved routes:", error);
    throw error;
  }
};

export const getSingleRoute = async (routeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    return await handleResponse(response); // Returns single full route object
  } catch (error) {
    console.error(`Error fetching route ${routeId}:`, error);
    throw error;
  }
};

export const deleteRoute = async (routeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    // Use handleResponse, it correctly handles 204 or JSON response
    return await handleResponse(response); // Returns { message } on success or null/error
  } catch (error) {
    console.error(`Error deleting route ${routeId}:`, error);
    throw error;
  }
};


// --- User Preferences CRUD ---

export const getUserPreferences = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/preferences`, {
      method: 'GET',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    return await handleResponse(response); // Returns preferences object
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
};

export const updateUserPreferences = async (preferences) => {
  // preferences expected: { defaultMobility?, voiceURI? }
  try {
    const response = await fetch(`${API_BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Authentication required
      },
      body: JSON.stringify(preferences),
    });
    return await handleResponse(response); // Returns updated preferences object
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};


// --- Accessibility Points CRUD ---

export const addAccessibilityPoint = async (pointData) => {
  // pointData expected: { lat, lng, type, description?, imageUrl?, source? }
  try {
    const response = await fetch(`${API_BASE_URL}/accessibility-points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Authentication likely required
      },
      body: JSON.stringify(pointData),
    });
    return await handleResponse(response); // Returns { message, pointId }
  } catch (error) {
    console.error("Error adding accessibility point:", error);
    throw error;
  }
};

export const getAccessibilityPoints = async (params) => {
  // params expected: { lat, lng, radius?, type? }
  try {
    // Construct query string
    const queryParams = new URLSearchParams({
        lat: params.lat,
        lng: params.lng,
    });
    if (params.radius) queryParams.append('radius', params.radius);
    if (params.type) queryParams.append('type', params.type);

    const response = await fetch(`${API_BASE_URL}/accessibility-points?${queryParams.toString()}`, {
      method: 'GET',
      // Decide if auth is needed for querying points. If public, remove getAuthHeader().
      // headers: { ...getAuthHeader() },
    });
    return await handleResponse(response); // Returns array of point objects
  } catch (error) {
    console.error("Error fetching accessibility points:", error);
    throw error;
  }
};

export const getSingleAccessibilityPoint = async (pointId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/accessibility-points/${pointId}`, {
      method: 'GET',
      // Decide if auth is needed for getting single point details.
      // headers: { ...getAuthHeader() },
    });
    return await handleResponse(response); // Returns single point object
  } catch (error) {
    console.error(`Error fetching accessibility point ${pointId}:`, error);
    throw error;
  }
};

// --- TODO (Optional based on backend): Add functions for ---
// - updateAccessibilityPoint(pointId, updateData) (PUT)
// - deleteAccessibilityPoint(pointId) (DELETE)
// These would require authentication and likely authorization checks.