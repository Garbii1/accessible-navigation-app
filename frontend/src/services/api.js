// src/services/api.js
// No changes needed from the previously generated complete code for api.js
// It already includes the pattern of accepting the token for authenticated routes.
// Ensure all protected functions like saveRoute, deleteRoute, getUserPreferences etc. accept 'token'.

/**
 * Centralized API service module for interacting with the backend.
 */

// --- Configuration ---
const backendOrigin = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = backendOrigin ? `${backendOrigin}/api` : '/api';

console.log(`API Base URL configured to: ${API_BASE_URL}`);

// --- Helper Functions ---
async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get('content-type');
    try {
      if (contentType && contentType.includes('application/json')) {
         errorData = await response.json();
      }
    } catch (e) { console.error("Failed to parse error response as JSON:", e); }
    const errorMessage = errorData?.error || errorData?.message || `HTTP error! Status: ${response.status} - ${response.statusText}`;
    console.error('API request failed:', errorMessage, 'Status:', response.status);
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
     console.log('API request successful with Status 204 No Content.');
     return null;
  }
  try {
     const data = await response.json();
     return data;
  } catch (e) {
      console.error("Failed to parse success response as JSON:", e);
      throw new Error("Received invalid JSON response from server.");
  }
}

// --- API Function Definitions ---

// -- Public Route --
export const fetchRoute = async (origin, destination, preferences) => {
  const endpoint = `${API_BASE_URL}/route`;
  console.log(`Fetching route from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, preferences }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching route from ${endpoint}:`, error);
    throw error;
  }
};

// --- Authenticated Routes ---
/** Requires Bearer token in Authorization header */
const getAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

export const saveRoute = async (routeData, token) => {
  const endpoint = `${API_BASE_URL}/routes`;
  console.log(`Saving route to ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(routeData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error saving route to ${endpoint}:`, error);
    throw error;
  }
};

export const getSavedRoutes = async (token) => {
  const endpoint = `${API_BASE_URL}/routes`;
  console.log(`Fetching saved routes from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching saved routes from ${endpoint}:`, error);
    throw error;
  }
};

export const getSingleRoute = async (routeId, token) => {
  const endpoint = `${API_BASE_URL}/routes/${routeId}`;
  console.log(`Fetching single route from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching route ${routeId} from ${endpoint}:`, error);
    throw error;
  }
};

export const deleteRoute = async (routeId, token) => {
  const endpoint = `${API_BASE_URL}/routes/${routeId}`;
  console.log(`Deleting route at ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error deleting route ${routeId} at ${endpoint}:`, error);
    throw error;
  }
};

export const getUserPreferences = async (token) => {
  const endpoint = `${API_BASE_URL}/user/preferences`;
  console.log(`Fetching user preferences from ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching user preferences from ${endpoint}:`, error);
    throw error;
  }
};

export const updateUserPreferences = async (preferences, token) => {
  const endpoint = `${API_BASE_URL}/user/preferences`;
  console.log(`Updating user preferences at ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(preferences),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error updating user preferences at ${endpoint}:`, error);
    throw error;
  }
};

export const addAccessibilityPoint = async (pointData, token) => {
  const endpoint = `${API_BASE_URL}/accessibility-points`;
  console.log(`Adding accessibility point at ${endpoint}`);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(pointData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error adding accessibility point at ${endpoint}:`, error);
    throw error;
  }
};

// Assuming GET points doesn't require auth based on previous backend code
export const getAccessibilityPoints = async (params) => {
  const queryParams = new URLSearchParams({ lat: params.lat, lng: params.lng });
  if (params.radius) queryParams.append('radius', params.radius);
  if (params.type) queryParams.append('type', params.type);
  const endpoint = `${API_BASE_URL}/accessibility-points?${queryParams.toString()}`;
  console.log(`Fetching accessibility points from ${endpoint}`);
  try {
    const response = await fetch(endpoint, { method: 'GET' });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching accessibility points from ${endpoint}:`, error);
    throw error;
  }
};

export const getSingleAccessibilityPoint = async (pointId) => {
  const endpoint = `${API_BASE_URL}/accessibility-points/${pointId}`;
   console.log(`Fetching single accessibility point from ${endpoint}`);
   try {
     const response = await fetch(endpoint, { method: 'GET' });
     return await handleResponse(response);
   } catch (error) {
     console.error(`Error fetching accessibility point ${pointId} from ${endpoint}:`, error);
     throw error;
   }
};