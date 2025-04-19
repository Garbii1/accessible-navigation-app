// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { usePreferences } from '../contexts/PreferencesContext';

// Components
import MapComponent from '../components/MapComponent';
// Removed RouteForm import - using inline inputs in TopControlPanel
import DirectionsPanel from '../components/DirectionsPanel';
import AudioGuidance from '../components/AudioGuidance';
import LoadingSpinner from '../components/LoadingSpinner';

// Hooks & Services
import useGeolocation from '../hooks/useGeolocation';
import { fetchRoute, saveRoute, getSingleRoute } from '../services/api'; // Added getSingleRoute

// --- Top Control Panel Component ---
function TopControlPanel({
    handleRouteRequest,
    isLoading,
    error,
    routeResponse,
    showDirections // Callback to show detailed directions
}) {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');

    // Update inputs if route changes (e.g., loaded from saved)
    useEffect(() => {
        if (routeResponse?.routes?.[0]?.legs?.[0]) {
            const leg = routeResponse.routes[0].legs[0];
            // Only set if different to avoid overriding user input during calculation
            if (leg.start_address && origin !== leg.start_address) setOrigin(leg.start_address);
            if (leg.end_address && destination !== leg.end_address) setDestination(leg.end_address);
        }
        // Don't clear inputs here on route clear, let user manage that
    }, [routeResponse]);


    const handleSubmit = (e) => {
        e.preventDefault();
        handleRouteRequest(origin, destination);
    }

    // --- Calculate Travel Times (Example - Requires Multi-Modal API Response) ---
    // This is a placeholder. The backend currently only calculates one mode.
    // You would need the backend to return durations for walking, driving, transit etc.
    const getTravelTime = (mode) => {
        if (!routeResponse?.routes?.[0]?.legs?.[0]) return "N/A";
        // Check if the calculated route matches the requested mode
        if (routeResponse.request?.travelMode?.toLowerCase() === mode) {
            return routeResponse.routes[0].legs[0].duration?.text || "N/A";
        }
        // Placeholder if backend doesn't return multiple modes
        return mode === 'walking' ? routeResponse.routes[0].legs[0].duration?.text || "N/A" : "N/A";
    };

    const walkingTime = getTravelTime('walking');
    // const drivingTime = getTravelTime('driving'); // Example
    // const transitTime = getTravelTime('transit'); // Example


    return (
        <div className="absolute top-0 left-0 right-0 z-10 p-3 md:pt-6 md:px-4 pointer-events-none">
            {/* Adjust max-width and mx-auto for desired width/centering */}
            <div className="container mx-auto max-w-md md:max-w-lg bg-white rounded-lg shadow-xl p-4 border border-gray-200 pointer-events-auto">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text" id="origin-top" name="origin" value={origin} onChange={(e) => setOrigin(e.target.value)}
                        placeholder="Origin (or 'My Location')" required aria-required="true"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        disabled={isLoading}
                    />
                    <input
                        type="text" id="destination-top" name="destination" value={destination} onChange={(e) => setDestination(e.target.value)}
                        placeholder="Destination" required aria-required="true"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm"
                    >
                        {isLoading && ( /* Spinner SVG */ <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>)}
                        {isLoading ? 'Calculating...' : 'Get Accessible Route'}
                    </button>
                </form>

                 {error && ( <p className="mt-2 text-xs text-center text-red-600 bg-red-50 p-1 rounded">{error}</p> )}

                {/* Travel Time Summary & Show Directions Button */}
                {!isLoading && routeResponse?.routes?.[0] && (
                     <div className="mt-3 pt-3 border-t text-center text-sm text-gray-700 space-y-1">
                        <p>Est. Duration ({preferences.mode}): <span className="font-semibold">{walkingTime}</span></p>
                         {/* Example Placeholders for other modes */}
                         {/* <div className="flex justify-center gap-3 text-xs text-gray-500">
                             <span>Drive: N/A</span> | <span>Fly: N/A</span>
                         </div> */}
                         <button
                             onClick={showDirections} // Callback to show the panel
                             className="mt-2 text-indigo-600 hover:underline text-xs font-medium"
                         >
                             Show Details & Audio
                         </button>
                     </div>
                 )}
            </div>
        </div>
    );
}

// --- Current Location Button --- (Keep as previously generated)
function CurrentLocationButton({ onClick, isLoading, error }) { /* ... */ }

// --- Floating Directions/Audio Panel ---
function FloatingDirectionsPanel({
    routeResponse,
    currentStep,
    audioTrigger,
    setCurrentStep,
    setAudioTrigger,
    onClose,
    onSaveRoute,
    isSavingRoute
}) {
    const { isSignedIn } = useAuth();

    if (!routeResponse?.routes?.[0]) return null;

    return (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:max-w-sm z-10 bg-white p-4 rounded-lg shadow-xl max-h-[45vh] md:max-h-[60vh] overflow-y-auto border border-gray-200 flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-2 border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-800">Directions</h3>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Close directions">
                    {/* Heroicon: x */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-1">
                 <DirectionsPanel
                    route={routeResponse.routes[0]}
                    onStepSelect={(step) => {
                        setCurrentStep(step);
                        // Optionally trigger audio immediately on manual selection
                        const timer = setTimeout(() => setAudioTrigger(step), 100);
                        // return () => clearTimeout(timer);
                    }}
                />
                <AudioGuidance
                    step={audioTrigger} // Play the triggered step
                />
            </div>
             {/* Save Route Button */}
             {isSignedIn && onSaveRoute && (
                <div className="flex-shrink-0 pt-3 mt-3 border-t">
                    <button
                        onClick={onSaveRoute} // Assumes parent handles prompting for name etc.
                        disabled={isSavingRoute}
                        className="w-full bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-white text-sm font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSavingRoute ? 'Saving...' : 'Save This Route'}
                    </button>
                </div>
             )}
        </div>
    );
}


// =============================
// --- HomePage Component ---
// =============================
function HomePage() {
    const { getToken, isSignedIn } = useAuth();
    const { preferences } = usePreferences();
    const navigate = useNavigate();
    const location = useLocation(); // To check for query params

    // State
    const [routeResponse, setRouteResponse] = useState(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [routeError, setRouteError] = useState(null);
    const [currentStep, setCurrentStep] = useState(null);
    const [audioTrigger, setAudioTrigger] = useState(null);
    const [showDirectionsPanel, setShowDirectionsPanel] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [isSavingRoute, setIsSavingRoute] = useState(false);

    // Geolocation hook (watch position for potential future use)
    const { location: userLocation, isLoading: locationLoading, error: locationError } = useGeolocation(true);

    // --- Load Saved Route If Requested ---
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const loadRouteId = params.get('loadRouteId');
        if (loadRouteId && isSignedIn) { // Only if signed in
            const loadSaved = async () => {
                setIsLoadingRoute(true);
                setRouteError(null);
                try {
                    const token = await getToken();
                    if (!token) throw new Error("Authentication required.");
                    const savedRouteData = await getSingleRoute(loadRouteId, token);
                    // The saved data likely contains the original Google response
                    if (savedRouteData?.googleRouteData) {
                         setRouteResponse(savedRouteData.googleRouteData);
                         setShowDirectionsPanel(true);
                         // Clear the query param from URL without full reload
                         navigate(location.pathname, { replace: true });
                    } else {
                        throw new Error("Saved route data is incomplete.");
                    }
                } catch (err) {
                    console.error("Failed to load saved route:", err);
                    setRouteError(`Could not load route: ${err.message}`);
                    navigate(location.pathname, { replace: true }); // Clear param on error too
                } finally {
                    setIsLoadingRoute(false);
                }
            };
            loadSaved();
        }
    }, [location.search, isSignedIn, getToken, navigate]); // Depend on search params and auth


    // --- Handle Route Request ---
    const handleRouteRequest = useCallback(async (origin, destination) => {
        setIsLoadingRoute(true);
        setRouteError(null);
        setRouteResponse(null);
        setCurrentStep(null);
        setAudioTrigger(null);
        setShowDirectionsPanel(false);

        let effectiveOrigin = origin;
        if (origin.toLowerCase() === 'mylocation' || origin === '') {
             if (locationLoading) { setRouteError("Getting your location..."); setIsLoadingRoute(false); return; }
             if (locationError) { setRouteError(`Location Error: ${locationError.message}`); setIsLoadingRoute(false); return; }
             if (userLocation) {
                 effectiveOrigin = { lat: userLocation.latitude, lng: userLocation.longitude };
             } else { setRouteError("Your location is unavailable."); setIsLoadingRoute(false); return; }
        }

        try {
             // Pass current preferences from context
             const response = await fetchRoute(effectiveOrigin, destination, preferences);
             setRouteResponse(response);
             // Don't automatically show full panel, summary shows in TopControlPanel
             // setShowDirectionsPanel(true);
        } catch (err) {
             console.error("Route calculation failed:", err);
             setRouteError(err.message || "Failed to calculate route.");
             setRouteResponse(null);
        } finally {
             setIsLoadingRoute(false);
        }
    }, [preferences, userLocation, locationLoading, locationError]);

    // --- Set Current/Audio Step ---
     useEffect(() => {
         if (routeResponse?.routes?.[0]?.legs?.[0]?.steps?.[0]) {
             const firstStep = routeResponse.routes[0].legs[0].steps[0];
             setCurrentStep(firstStep);
             // Only trigger audio automatically if the *directions panel* is opened
             // const timer = setTimeout(() => setAudioTrigger(firstStep), 700);
             // return () => clearTimeout(timer);
         } else {
             setCurrentStep(null);
             setAudioTrigger(null);
         }
     }, [routeResponse]); // Trigger based on route response change

     // --- Proactive Audio Placeholder ---
     // useEffect(() => { /* ... Proactive logic watching userLocation ... */ }, [userLocation, ...]);

    // --- Map Centering ---
    useEffect(() => {
        if (mapInstance && userLocation && !routeResponse) {
             mapInstance.panTo({ lat: userLocation.latitude, lng: userLocation.longitude });
             mapInstance.setZoom(16);
        }
        // Note: Map centering/bounds fitting for the route is now handled within MapComponent's effect
    }, [mapInstance, userLocation, routeResponse]);

    const centerOnUser = () => { /* ... as before ... */ };

     // --- Save Route ---
      const handleSaveRoute = useCallback(async () => {
          if (!routeResponse || !isSignedIn) return;
          const routeName = prompt("Enter a name for this route:", "My Saved Route");
          if (!routeName) return; // User cancelled

          setIsSavingRoute(true);
          setRouteError(null);
          try {
              const token = await getToken();
              if (!token) throw new Error("Authentication required.");

              // Ensure we have lat/lng data if possible
              const startLoc = routeResponse.routes[0].legs[0].start_location;
              const endLoc = routeResponse.routes[0].legs[0].end_location;
              const originData = startLoc ? { lat: startLoc.lat(), lng: startLoc.lng(), address: routeResponse.routes[0].legs[0].start_address } : { address: "Unknown Origin" };
              const destinationData = endLoc ? { lat: endLoc.lat(), lng: endLoc.lng(), address: routeResponse.routes[0].legs[0].end_address } : { address: "Unknown Destination" };

              const routeToSave = {
                  name: routeName,
                  origin: originData,
                  destination: destinationData,
                  googleRouteData: routeResponse, // Consider pruning this data
                  customWarnings: routeResponse.custom_accessibility_warnings || []
              };
              await saveRoute(routeToSave, token);
              alert("Route saved!"); // Replace with better UI feedback
              setShowDirectionsPanel(false); // Close panel after saving

          } catch (err) {
              console.error("Failed to save route:", err);
              setRouteError(err.message || "Could not save route.");
              alert(`Error saving route: ${err.message || "Unknown error"}`);
          } finally {
              setIsSavingRoute(false);
          }
      }, [routeResponse, getToken, isSignedIn]);


    return (
        <div className="relative w-full h-screen overflow-hidden"> {/* Use h-screen for full viewport height */}
            {/* Map takes full screen behind controls */}
            <div className="absolute inset-0 z-0">
                <MapComponent
                    routeResponse={routeResponse}
                    userLocation={userLocation}
                    onLoad={setMapInstance}
                />
            </div>

            {/* Top Controls Overlay */}
            <TopControlPanel
                 handleRouteRequest={handleRouteRequest}
                 isLoading={isLoadingRoute}
                 error={routeError}
                 routeResponse={routeResponse}
                 showDirections={() => setShowDirectionsPanel(true)} // Pass callback to open panel
            />

            {/* Floating Directions Panel (Conditional) */}
            {showDirectionsPanel && (
                <FloatingDirectionsPanel
                    routeResponse={routeResponse}
                    currentStep={currentStep}
                    audioTrigger={audioTrigger}
                    setCurrentStep={setCurrentStep}
                    setAudioTrigger={setAudioTrigger}
                    onClose={() => setShowDirectionsPanel(false)}
                    onSaveRoute={handleSaveRoute}
                    isSavingRoute={isSavingRoute}
                />
            )}

             {/* Current Location Button */}
             <CurrentLocationButton
                 onClick={centerOnUser}
                 isLoading={locationLoading}
                 error={locationError}
             />
        </div>
    );
}

export default HomePage;