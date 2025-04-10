const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // Use relative path for same-origin or env var

export const fetchRoute = async (origin, destination, preferences) => {
  try {
    const response = await fetch(`${API_BASE_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ origin, destination, preferences }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // This is the Google Directions API response object
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error; // Re-throw to handle in the component
  }
};

// Add other API functions here (e.g., save preferences, get saved routes)