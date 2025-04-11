// src/services/api.js

/**
 * Centralized API service module for interacting with the backend.
 */

// --- Configuration ---

// Construct the Base URL for the API endpoint.
// Reads the backend origin from the Vite environment variable VITE_API_BASE_URL.
// Appends the '/api' prefix which is expected by the backend routes and CORS configuration.
// Provides a fallback to '/api' for same-origin requests or if the env var is not set.
const backendOrigin = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = backendOrigin ? `${backendOrigin}/api` : '/api';

console.log(`API Base URL configured to: ${API_BASE_URL}`); // Log for debugging

// --- Helper Functions ---

/**
 * Handles the response from a fetch request.
 * Checks for errors, parses JSON, and throws specific errors.
 * @param {Response} response - The response object from fetch.
 * @returns {Promise<any>} - The parsed JSON data or null for 204 responses.
 * @throws {Error} - Throws an error with backend message or HTTP status.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get('content-type');
    try {
      // Try to parse error message from backend ONLY if it's JSON
      if (contentType && contentType.includes('application/json')) {
         errorData = await response.json();
      }
    } catch (e) {
      // Ignore JSON parsing errors if response is not JSON
      console.error("Failed to parse error response as JSON:", e);
    }
    // Throw error message from backend if available, otherwise generic HTTP error
    const errorMessage = errorData?.error || errorData?.message || `HTTP error! Status: ${response.status} - ${response.statusText}`;
    console.error('API request failed:', errorMessage, 'Status:', response.status);
    throw new Error(errorMessage);
  }

  // Handle cases like 204 No Content where there might not be a body
  if (response.status === 204) {
     console.log('API request successful with Status 204 No Content.');
     return null; // Indicate success with no content
  }

  // Otherwise, parse and return the JSON body
  try {
     const data = await response.json();
     return data;
  } catch (e) {
      console.error("Failed to parse success response as JSON:", e);
      throw new Error("Received invalid JSON response from server.");
  }
}

/**
 * Placeholder function to get Authentication headers.
 * Replace with your actual logic to retrieve and format the auth token.
 * @returns {Object} - Headers object containing Authorization or empty object.
 */
const getAuthHeader = () => {
    // Example: Retrieve token from localStorage or state management
    // const token = localStorage.getItem('authToken');
    const token = null; // Replace with actual token retrieval

    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    // console.warn("No auth token found for API request."); // Uncomment if auth is expected
    return {}; // Return empty object if no token
};


// --- API Function Definitions ---

/**
 * Fetches route calculation results from the backend.
 * @param {string | {lat: number, lng: number}} origin - Origin address string or coordinates.
 * @param {string | {lat: number, lng: number}} destination - Destination address string or coordinates.
 * @param {object} preferences - User preferences (avoidStairs, mode, etc.).
 * @returns {Promise<object>} - The Google Directions API response object from the backend.
 */
export const fetchRoute = async (origin, destination, preferences) => {
  const endpoint = `${API_BASE_URL}/route`;
  console.log(`Fetching route from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Auth header if route calculation ever requires login?
        // ...getAuthHeader(),
      },
      body: JSON.stringify({ origin, destination, preferences }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching route from ${endpoint}:`, error);
    // Re-throw for component-level error handling (e.g., updating UI state)
    throw error;
  }
};

/**
 * Saves a calculated route for the current user.
 * @param {object} routeData - Data required by the backend { name, origin, destination, googleRouteData, customWarnings? }.
 * @returns {Promise<object>} - Success message and new route ID { message, routeId }.
 */
export const saveRoute = async (routeData) => {
  const endpoint = `${API_BASE_URL}/routes`;
  console.log(`Saving route to ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Authentication likely required
      },
      body: JSON.stringify(routeData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error saving route to ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Retrieves a list of saved routes (summary) for the current user.
 * @returns {Promise<Array<object>>} - Array of saved route summary objects.
 */
export const getSavedRoutes = async () => {
  const endpoint = `${API_BASE_URL}/routes`;
  console.log(`Fetching saved routes from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching saved routes from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Retrieves full details for a single saved route.
 * @param {string} routeId - The ID of the route to fetch.
 * @returns {Promise<object>} - The full route object.
 */
export const getSingleRoute = async (routeId) => {
  const endpoint = `${API_BASE_URL}/routes/${routeId}`;
  console.log(`Fetching single route from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching route ${routeId} from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Deletes a saved route for the current user.
 * @param {string} routeId - The ID of the route to delete.
 * @returns {Promise<object|null>} - Success message { message } or null if 204.
 */
export const deleteRoute = async (routeId) => {
  const endpoint = `${API_BASE_URL}/routes/${routeId}`;
  console.log(`Deleting route at ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting route ${routeId} at ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Retrieves the preferences for the current user.
 * @returns {Promise<object>} - The user's preferences object.
 */
export const getUserPreferences = async () => {
  const endpoint = `${API_BASE_URL}/user/preferences`;
  console.log(`Fetching user preferences from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...getAuthHeader(), // Authentication required
      },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching user preferences from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Updates the preferences for the current user.
 * @param {object} preferences - The preference fields to update { defaultMobility?, voiceURI? }.
 * @returns {Promise<object>} - The updated preferences object.
 */
export const updateUserPreferences = async (preferences) => {
  const endpoint = `${API_BASE_URL}/user/preferences`;
  console.log(`Updating user preferences at ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Authentication required
      },
      body: JSON.stringify(preferences),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error updating user preferences at ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Adds a new accessibility point.
 * @param {object} pointData - Data for the new point { lat, lng, type, description?, imageUrl?, source? }.
 * @returns {Promise<object>} - Success message and new point ID { message, pointId }.
 */
export const addAccessibilityPoint = async (pointData) => {
  const endpoint = `${API_BASE_URL}/accessibility-points`;
  console.log(`Adding accessibility point at ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(), // Authentication likely required
      },
      body: JSON.stringify(pointData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error adding accessibility point at ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Retrieves accessibility points near a given location.
 * @param {object} params - Query parameters { lat, lng, radius?, type? }.
 * @returns {Promise<Array<object>>} - Array of nearby accessibility point objects.
 */
export const getAccessibilityPoints = async (params) => {
  // Construct query string safely
  const queryParams = new URLSearchParams({
      lat: params.lat, // Required
      lng: params.lng, // Required
  });
  if (params.radius) queryParams.append('radius', params.radius);
  if (params.type) queryParams.append('type', params.type);

  const endpoint = `${API_BASE_URL}/accessibility-points?${queryParams.toString()}`;
  console.log(`Fetching accessibility points from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      // Decide if auth is needed for querying points (currently public in backend)
      // headers: { ...getAuthHeader() },
    });
    // Backend formats the response, just handle it
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching accessibility points from ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Retrieves details for a single accessibility point.
 * @param {string} pointId - The ID of the accessibility point.
 * @returns {Promise<object>} - The detailed accessibility point object.
 */
export const getSingleAccessibilityPoint = async (pointId) => {
  const endpoint = `${API_BASE_URL}/accessibility-points/${pointId}`;
  console.log(`Fetching single accessibility point from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      // Decide if auth is needed for getting single point details (currently public)
      // headers: { ...getAuthHeader() },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching accessibility point ${pointId} from ${endpoint}:`, error);
    throw error;
  }
};

// --- TODO ---
// Add functions for PUT/DELETE on accessibility points if implementing update/delete features.
// Ensure robust authentication is implemented and integrated via getAuthHeader.