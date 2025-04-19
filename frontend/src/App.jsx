// src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';

// --- Import Components ---
// Make sure these files exist in ./components/ and export the components correctly
import MapComponent from './components/MapComponent';
import RouteForm from './components/RouteForm';
import DirectionsPanel from './components/DirectionsPanel';
import AudioGuidance from './components/AudioGuidance';

// --- Import API Service ---
// Make sure this file exists in ./services/ and exports the function correctly
import { fetchRoute } from './services/api';

// --- Main Application Component ---
function App() {
  // --- State Variables ---
  const [routeResponse, setRouteResponse] = useState(null); // Stores the response from Google Directions API
  const [isLoading, setIsLoading] = useState(false); // Tracks if route calculation is in progress
  const [error, setError] = useState(null); // Stores any errors during route calculation
  const [currentStep, setCurrentStep] = useState(null); // Tracks the currently selected step for audio guidance

  // User preferences state (can be loaded from localStorage/backend later)
  const [preferences, setPreferences] = useState({
    avoidStairs: true,
    wheelchairAccessibleTransit: true,
    mode: 'walking', // Default travel mode
  });

  // --- API Call Logic ---
  const handleRouteRequest = useCallback(async (origin, destination) => {
    console.log("Requesting route:", { origin, destination, preferences });
    setIsLoading(true);
    setError(null);
    setRouteResponse(null); // Clear previous route
    setCurrentStep(null); // Clear previous step

    try {
      // Basic validation (more robust validation is recommended)
      if (!origin || !destination) {
         throw new Error("Please enter both origin and destination.");
      }

      // Call the API service function
      const response = await fetchRoute(origin, destination, preferences);

      console.log("Route response received:", response);
      setRouteResponse(response); // Update state with the route data

    } catch (err) {
      console.error("Route calculation failed:", err);
      setError(err.message || "Failed to calculate route. Please check inputs or try again.");
      setRouteResponse(null); // Ensure route response is null on error
    } finally {
      setIsLoading(false); // Ensure loading state is turned off
    }
  }, [preferences]); // Re-create this function if preferences change

  // --- Effect to update currentStep when route changes ---
  useEffect(() => {
     // When a new route response arrives, set the current step to the first step
     if (routeResponse?.routes?.[0]?.legs?.[0]?.steps?.[0]) {
       setCurrentStep(routeResponse.routes[0].legs[0].steps[0]);
     } else {
       // If no route or no steps, clear the current step
       setCurrentStep(null);
     }
   }, [routeResponse]); // Run only when routeResponse changes

   // --- Handler for changing preferences (Example) ---
   const handlePreferenceChange = (event) => {
      const { name, type, checked, value } = event.target;
      setPreferences(prev => ({
         ...prev,
         [name]: type === 'checkbox' ? checked : value
      }));
   };

  // --- Render Logic ---
  return (
    // Root container div
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50 flex flex-col font-sans">

      {/* Header Section */}
      <header className="bg-white shadow-md sticky top-0 z-50 w-full">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <h1 className="text-2xl font-bold text-indigo-700 tracking-tight">
            Accessible Navigation
          </h1>
          {/* Optional: Add Nav Links here later */}
        </nav>
      </header>

      {/* Main Content Area */}
       <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 w-full">
         {/* Grid Layout for Panels */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

           {/* Left Panel (Controls & Directions) */}
           <div className="lg:col-span-1 bg-white p-5 rounded-lg shadow-xl flex flex-col gap-5 h-full max-h-[calc(100vh-120px)] overflow-y-auto border border-gray-200">
             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
               Plan Your Route
             </h2>

             {/* --- Component: Route Form --- */}
             {/* Renders the origin/destination inputs and submit button */}
             <RouteForm onSubmit={handleRouteRequest} isLoading={isLoading} />

             {/* Loading State Indicator */}
             {isLoading && (
                <div className="text-center py-4 text-indigo-600 font-medium">
                    Calculating accessible route...
                    {/* Optional: Add a spinner SVG here */}
                </div>
             )}

             {/* Error Message Display */}
             {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span>{error}</span>
                </div>
             )}

             {/* Results Panel (Directions & Audio) */}
             {/* Show only if NOT loading AND a valid route response exists */}
             {!isLoading && routeResponse?.routes?.[0] && (
               <div className="mt-4 border-t border-gray-200 pt-4 space-y-4">
                 {/* --- Component: Directions Panel --- */}
                 <DirectionsPanel
                     route={routeResponse.routes[0]} // Pass the first route object
                     onStepSelect={setCurrentStep} // Pass function to update selected step state
                 />
                 {/* --- Component: Audio Guidance --- */}
                 <AudioGuidance
                      step={currentStep} // Pass the currently selected step object
                 />
                </div>
             )}

             {/* Placeholder Text: Initial state or No Results */}
             {!isLoading && !error && !routeResponse && (
                <p className="text-center text-gray-500 text-sm mt-4">
                    Enter an origin and destination to plan your route.
                </p>
             )}
             {!isLoading && routeResponse && (!routeResponse.routes || routeResponse.routes.length === 0) && (
                 <p className="text-center text-orange-600 text-sm mt-4">
                     No routes found matching your criteria. Please adjust origin, destination, or preferences.
                 </p>
              )}
           </div> {/* End Left Panel */}

           {/* Right Panel (Map) */}
           <div className="lg:col-span-2 min-h-[400px] lg:min-h-0"> {/* Ensures map space on mobile */}
              {/* --- Component: Map --- */}
              {/* Displays the map and the calculated route */}
              <MapComponent routeResponse={routeResponse} />
           </div> {/* End Right Panel */}

         </div> {/* End Grid */}
       </main> {/* End Main Content Area */}

      {/* Footer Section */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 w-full mt-auto">
          Accessible Navigation App © {new Date().getFullYear()}
          {/* Optional: Add Privacy Policy, Terms links here */}
      </footer>

    </div> // End Root container
  );
}

// --- NO PLACEHOLDER COMPONENT DEFINITIONS HERE ANYMORE ---
// RouteForm, DirectionsPanel etc. should be in their own files and imported above.

export default App;