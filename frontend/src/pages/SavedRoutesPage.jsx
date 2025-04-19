// src/pages/SavedRoutesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { getSavedRoutes, deleteRoute } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SavedRouteItem from '../components/SavedRouteItem';

function SavedRoutesPage() {
  const { getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoutes = useCallback(async () => {
    if (!isSignedIn) {
      setRoutes([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token unavailable.");
      const data = await getSavedRoutes(token);
      setRoutes(data || []);
    } catch (err) {
      console.error("Failed to fetch saved routes:", err);
      setError(err.message || "Could not load saved routes.");
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
     if (isAuthLoaded) { fetchRoutes(); }
  }, [isAuthLoaded, fetchRoutes]);

  const handleSelectRoute = (routeId) => {
     console.log("Selected route ID:", routeId);
     navigate(`/?loadRouteId=${routeId}`); // Navigate to home with query param
  };

  const handleDeleteRoute = async (routeId) => {
     if (!window.confirm("Are you sure you want to delete this route?")) return;
     setError(null);
     try {
         const token = await getToken();
         if (!token) throw new Error("Authentication token unavailable.");
         await deleteRoute(routeId, token);
         fetchRoutes(); // Refetch after delete
     } catch (err) {
          console.error("Failed to delete route:", err);
          setError(err.message || "Could not delete route.");
     }
  };

  if (!isAuthLoaded || isLoading) {
     return (
         <div className="p-4 sm:p-6 lg:p-8">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Routes</h2>
             <LoadingSpinner message="Loading..." />
         </div>
     );
  }

  return (
    // Add padding/margin to position it within the TopBarLayout's main area
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Saved Routes</h2>
      {error && ( /* Error display */ )}
      {!error && routes.length === 0 && ( /* No routes message */ )}
      {routes.length > 0 && (
        <ul className="space-y-2 bg-white p-4 rounded-lg shadow-md border border-gray-100 divide-y divide-gray-100">
          {routes.map((route) => (
            <SavedRouteItem key={route._id} route={route} onSelect={handleSelectRoute} onDelete={handleDeleteRoute} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default SavedRoutesPage;