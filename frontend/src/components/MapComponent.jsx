// frontend/src/components/MapComponent.jsx

import React, { useState, useEffect, useCallback } from 'react'; // Removed unused useRef
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

// Updated containerStyle to fill parent height
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center remains Lagos, Nigeria
const defaultCenter = {
  lat: 6.5244,
  lng: 3.3792
};

// Simple Loading Spinner Component (or use a library like react-spinners)
const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-full text-gray-500">
    <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-2">Loading Map...</p>
  </div>
);

function MapComponent({ routeResponse }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'directions']
  });

  const [map, setMap] = useState(null);
  // Center state can still be useful if you want to manually pan later
  const [center, setCenter] = useState(defaultCenter);

  const onLoad = useCallback(function callback(mapInstance) {
    // Initial setup, maybe set slightly different zoom?
    // mapInstance.setZoom(11); // Example
    console.log("Map loaded:", mapInstance);
    setMap(mapInstance);
  }, []); // Empty dependency array is correct here

  const onUnmount = useCallback(function callback(mapInstance) {
    console.log("Map unmounted");
    setMap(null);
  }, []); // Empty dependency array is correct here


  // --- Improvement: Fit Bounds to Route ---
  useEffect(() => {
    // Ensure map instance and route data with bounds exist
    if (map && routeResponse?.routes?.[0]?.bounds) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        // Extract bounds from the Google Directions API response
        const routeBounds = routeResponse.routes[0].bounds;
        const ne = new window.google.maps.LatLng(routeBounds.northeast.lat, routeBounds.northeast.lng);
        const sw = new window.google.maps.LatLng(routeBounds.southwest.lat, routeBounds.southwest.lng);
        bounds.extend(ne);
        bounds.extend(sw);

        // Fit the map to these bounds
        map.fitBounds(bounds);

        // Optional: Add padding around the bounds (e.g., 50 pixels)
        // map.fitBounds(bounds, 50);

        // Optional: Prevent over-zooming on very short routes
        const currentZoom = map.getZoom();
        if (currentZoom > 16) { // Adjust max zoom level as needed
           map.setZoom(16);
        }

      } catch (error) {
          console.error("Error fitting map bounds:", error);
          // Fallback: Center on default or route start if bounds fail
          if (routeResponse?.routes?.[0]?.legs?.[0]?.start_location) {
             map.setCenter(routeResponse.routes[0].legs[0].start_location);
             map.setZoom(14); // Reasonable zoom fallback
          }
      }
    } else if (map && !routeResponse) {
       // If route is cleared, reset map to default center/zoom
       map.setCenter(defaultCenter);
       map.setZoom(12);
    }
  }, [map, routeResponse]); // Re-run this effect when map instance or routeResponse changes


  // --- Improvement: Enhanced Error Display ---
  if (loadError) {
    return (
      <div className="flex justify-center items-center h-96 md:h-[500px] lg:h-[600px] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md" role="alert">
        <div>
          <strong className="font-bold">Error loading map:</strong>
          <span className="block sm:inline ml-2">{loadError.message}</span>
          <p className="text-sm mt-1">Please check your internet connection and API key configuration.</p>
        </div>
      </div>
    );
  }

  // --- Improvement: Use Loading Spinner ---
  if (!isLoaded) {
      return (
        <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-lg shadow-md overflow-hidden bg-gray-100">
             <LoadingSpinner />
        </div>
      );
  }

  // --- Main Map Rendering ---
  return (
    // Parent div controls the visible height and styling
    <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-lg shadow-lg overflow-hidden border border-gray-200">
         <GoogleMap
            // mapContainerStyle takes 100% height from parent now
            mapContainerStyle={containerStyle}
            // Center is managed by fitBounds effect mostly, but needed initially
            center={center}
            // Initial zoom, fitBounds will likely override this when route loads
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                // Optional controls customization
                // streetViewControl: false,
                // mapTypeControl: false,
                mapTypeControlOptions: {
                   style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                   position: window.google.maps.ControlPosition.TOP_RIGHT
                },
                fullscreenControl: false,
                zoomControl: true, // Keep zoom control
                zoomControlOptions: {
                   position: window.google.maps.ControlPosition.LEFT_TOP
                },
                // Consider adding gestureHandling: 'cooperative' for better mobile UX
                // gestureHandling: 'cooperative',
            }}
          >
            {/* Markers, InfoWindows etc. can be added here */}
            {/* Example: <Marker position={someLatLng} /> */}

            {/* Display Directions using DirectionsRenderer */}
            {routeResponse && (
              <DirectionsRenderer
                directions={routeResponse}
                options={{
                    // Example: Customize polyline
                    // polylineOptions: {
                    //     strokeColor: '#3b82f6', // Blue-500
                    //     strokeWeight: 6,
                    //     strokeOpacity: 0.8
                    // },
                    // Example: Hide default A/B markers if using custom ones
                    // suppressMarkers: true
                }}
              />
            )}
         </GoogleMap>
    </div>
  );
}

// Use React.memo for performance optimization
export default React.memo(MapComponent);