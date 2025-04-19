import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext'; // If routes are user-specific
import { getSavedRoutes, deleteRoute } from '../services/api'; // Import API functions
import LoadingSpinner from '../components/LoadingSpinner'; // Assuming this exists
import SavedRouteItem from '../components/SavedRouteItem'; // Assuming this exists

function SavedRoutesPage() {
  // const { isAuthenticated } = useAuth(); // Check if user is logged in
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoutes = async () => {
    // if (!isAuthenticated) {
    //   setError("Please log in to view saved routes.");
    //   setRoutes([]);
    //   return;
    // }
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching saved routes...");
      const data = await getSavedRoutes(); // Call API service
      setRoutes(data || []);
      console.log("Fetched routes:", data);
    } catch (err) {
      console.error("Failed to fetch saved routes:", err);
      setError(err.message || "Could not load saved routes.");
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch routes on component mount
  useEffect(() => {
    fetchRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Add dependencies like isAuthenticated if needed

  const handleSelectRoute = (routeId) => {
     console.log("Selected route ID:", routeId);
     // TODO: Implement logic to load this route on the map
     // Maybe navigate back to map page with routeId or route data?
     // navigate(`/?routeId=${routeId}`); // Example using react-router
  };

  const handleDeleteRoute = async (routeId) => {
     if (!window.confirm("Are you sure you want to delete this route?")) {
         return;
     }
     console.log("Deleting route ID:", routeId);
     // Optimistic deletion? Or wait for API?
     // setRoutes(prev => prev.filter(r => r._id !== routeId)); // Optimistic
     try {
         await deleteRoute(routeId);
         // Refetch routes after successful deletion
         fetchRoutes();
     } catch (err) {
          console.error("Failed to delete route:", err);
          setError(err.message || "Could not delete route.");
          // Optionally revert optimistic deletion here if implemented
     }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Routes</h2>

      {isLoading && <LoadingSpinner message="Loading saved routes..." />}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && routes.length === 0 && (
        <p className="text-center text-gray-500">You haven't saved any routes yet.</p>
      )}

      {!isLoading && routes.length > 0 && (
        <ul className="space-y-2 bg-white p-4 rounded-lg shadow border border-gray-100">
          {routes.map((route) => (
            <SavedRouteItem
              key={route._id}
              route={route}
              onSelect={handleSelectRoute}
              onDelete={handleDeleteRoute}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default SavedRoutesPage;