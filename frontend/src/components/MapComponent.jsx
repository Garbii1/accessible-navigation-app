import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px' // Adjust as needed
};

// Example center (Update to user's location or a default)
// Focus on Lagos, Nigeria initially as requested (or one of the other cities)
const defaultCenter = {
  lat: 6.5244,
  lng: 3.3792
};

function MapComponent({ routeResponse }) { // Accept routeResponse as a prop
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'directions'] // Ensure directions library is loaded
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter); // Allow dynamic center

  const onLoad = useCallback(function callback(mapInstance) {
    // Optional: Adjust bounds or do other setup once map loads
    // const bounds = new window.google.maps.LatLngBounds(center);
    // mapInstance.fitBounds(bounds);
     console.log("Map loaded:", mapInstance);
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback(mapInstance) {
     console.log("Map unmounted");
    setMap(null);
  }, []);

  if (loadError) {
    return <div className="text-red-500">Error loading maps: {loadError.message}</div>;
  }

  return isLoaded ? (
    <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-lg shadow-md overflow-hidden">
         <GoogleMap
            mapContainerStyle={containerStyle}
            center={center} // Use dynamic center state
            zoom={12} // Adjust zoom level
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                // Optional: disable some controls for a cleaner look
                // streetViewControl: false,
                // mapTypeControl: false,
                fullscreenControl: false,
                zoomControlOptions: { position: window.google.maps.ControlPosition.LEFT_TOP },
            }}
          >
            {/* Example Marker at the center */}
            {/* <Marker position={center} /> */}

            {/* Display Directions if routeResponse exists */}
            {routeResponse && (
              <DirectionsRenderer
                directions={routeResponse}
                options={{
                    // Customize appearance if needed
                    // polylineOptions: { strokeColor: '#FF0000', strokeWeight: 5 },
                    // suppressMarkers: true // If you want to use custom markers
                }}
              />
            )}

            {/* Add other map components like Markers, InfoWindows etc. here */}
         </GoogleMap>
    </div>

  ) : <div className="flex justify-center items-center h-96"><p>Loading Map...</p></div>;
}

export default React.memo(MapComponent); // Memoize for performance