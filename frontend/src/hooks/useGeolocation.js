import { useState, useEffect } from 'react';

const defaultOptions = {
  enableHighAccuracy: true,
  timeout: 5000, // Give up after 5 seconds
  maximumAge: 0 // Don't use a cached position
};

function useGeolocation(watch = false, options = defaultOptions) {
  const [location, setLocation] = useState(null); // { latitude, longitude, accuracy, timestamp }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Stores GeolocationPositionError
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    let watchId = null;
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError({ code: 0, message: "Geolocation is not supported by this browser." });
      setIsLoading(false);
      return;
    }

    const onSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
      setIsLoading(false);
      setError(null); // Clear previous errors on success
    };

    const onError = (err) => {
      console.warn(`Geolocation Error (${err.code}): ${err.message}`);
      setError({ code: err.code, message: err.message });
      setIsLoading(false);
      setLocation(null); // Clear location on error
    };

    if (watch) {
      // Start watching position
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
      setIsWatching(true);
      console.log("Started watching geolocation, ID:", watchId);
    } else {
      // Get current position once
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }

    // Cleanup function
    return () => {
      if (watch && watchId !== null) {
        console.log("Stopping watching geolocation, ID:", watchId);
        navigator.geolocation.clearWatch(watchId);
        setIsWatching(false);
      }
    };
  }, [watch, options]); // Re-run effect if 'watch' or 'options' change

  return { location, isLoading, error, isWatching };
}

export default useGeolocation;