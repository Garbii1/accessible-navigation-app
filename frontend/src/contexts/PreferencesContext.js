// src/contexts/PreferencesContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
// Import REAL API functions - Make sure these exist in your services/api.js
import { getUserPreferences, updateUserPreferences } from '../services/api';
// Import Clerk hook to get user ID and token for authenticated requests
import { useAuth } from '@clerk/clerk-react';

// --- Create the Context ---
// Initial value is null; components must be descendants of the Provider to consume it.
const PreferencesContext = createContext(null);

// --- Default Preferences Structure ---
// Define the shape and default values. This ensures the preferences object always has expected keys.
const defaultPreferences = {
  defaultMobility: 'standard', // Options: 'standard', 'wheelchair'
  voiceURI: null,             // Stores the string URI of the selected Web Speech API voice
  avoidStairs: true,          // Preference for walking routes
  wheelchairAccessibleTransit: true, // Preference for transit routes
  mode: 'walking',            // Default routing mode ('walking', 'transit')
  // Add more preferences here as needed, e.g.:
  // preferredUnits: 'metric',
};

// --- Preferences Provider Component ---
// Fetches, stores, and provides update functions for user preferences.
export function PreferencesProvider({ children }) {
  // State for the user's preferences object
  const [preferences, setPreferences] = useState(defaultPreferences);
  // State to track if preferences are currently being loaded from the backend
  const [isLoading, setIsLoading] = useState(true);
  // State to store any errors encountered during loading or saving
  const [error, setError] = useState(null);
  // Get authentication state and functions from Clerk's context
  const { userId, getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();

  // --- Function to Load Preferences ---
  // useCallback ensures this function reference remains stable unless dependencies change.
  const loadPrefs = useCallback(async () => {
    // Only proceed if authentication status is known and user is signed in
    if (!isSignedIn || !userId) {
      setPreferences(defaultPreferences); // Not signed in, use defaults
      setIsLoading(false);
      setError(null);
      console.log("PreferencesContext: User not signed in or ID missing, using default preferences.");
      return;
    }

    // Indicate loading state
    setIsLoading(true);
    setError(null);
    console.log(`PreferencesContext: Loading preferences for user ${userId}`);

    try {
      const token = await getToken(); // Fetch the current session token
      if (!token) {
        // Should ideally not happen if isSignedIn is true, but handle defensively
        throw new Error("Authentication token is unavailable.");
      }

      const loadedPrefs = await getUserPreferences(token); // Call backend API
      // Merge loaded preferences with defaults. Loaded values override defaults.
      // Also merge with previous state in case only partial data was loaded? Generally safer to merge with defaults.
      setPreferences(prev => ({ ...defaultPreferences, ...prev, ...loadedPrefs }));
      console.log("PreferencesContext: Preferences loaded successfully:", loadedPrefs);
    } catch (err) {
      console.error("PreferencesContext: Failed to load preferences:", err);
      setError(`Could not load preferences: ${err.message}. Using default settings.`);
      setPreferences(defaultPreferences); // Revert to defaults on error
    } finally {
      setIsLoading(false); // Ensure loading state is reset
    }
    // Dependencies for useCallback: these values changing should recreate the function
  }, [userId, isSignedIn, getToken]);

  // --- Effect Hook to Load Preferences ---
  // This effect runs when the component mounts and whenever auth status changes.
  useEffect(() => {
    // Wait until Clerk has finished loading its state before attempting to load preferences
    if (isAuthLoaded) {
      loadPrefs();
    }
    // Otherwise, loading will be triggered when isAuthLoaded becomes true
  }, [isAuthLoaded, loadPrefs]); // Depend on auth status and the memoized load function

  // --- Function to Update Preferences ---
  // useCallback ensures this function reference remains stable unless dependencies change.
  const updatePreferences = useCallback(async (newPrefs) => {
    // Check authentication status before attempting to save
    if (!isSignedIn || !userId) {
       console.warn("PreferencesContext: Cannot save preferences, user not authenticated.");
       setError("You must be logged in to save preferences.");
       return; // Exit if not authenticated
    }

    // Calculate the next state optimistically for immediate UI feedback
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    setError(null); // Clear previous errors on a new save attempt

    console.log(`PreferencesContext: Attempting to save preferences for user ${userId}:`, updatedPrefs);

    try {
        const token = await getToken(); // Get a fresh token for the save request
        if (!token) throw new Error("Authentication token unavailable for saving.");

        // Call the backend API to persist the updated preferences
        await updateUserPreferences(updatedPrefs, token); // Pass the entire updated object
        console.log("PreferencesContext: Preferences saved successfully.");
        // Optionally: Show a success notification to the user
    } catch (err) {
        console.error("PreferencesContext: Failed to save preferences:", err);
        setError(`Failed to save preferences: ${err.message}. Please try again.`);
        // Optional: Revert the optimistic update if the save fails
        // Consider a mechanism to inform the user more gracefully than just an error message
        // loadPrefs(); // Re-fetching would revert the UI to the last saved state
    }
    // Dependencies: Include state/functions used inside the callback
  }, [userId, preferences, isSignedIn, getToken]); // Removed loadPrefs dependency

  // --- Memoize the Context Value ---
  // Creates a stable context value object that only changes when its contents change.
  // This prevents unnecessary re-renders of components consuming the context.
  const value = useMemo(() => ({
    preferences,
    isLoading,
    error,
    updatePreferences,
    reloadPreferences: loadPrefs, // Expose the load function for manual refresh/retry
  }), [preferences, isLoading, error, updatePreferences, loadPrefs]); // List all returned values/functions

  // --- Provide the Context to Children ---
  // Ensure syntax is correct here, especially closing tags and parentheses.
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  ); 
} 

// --- Custom Hook for Consuming the Context ---
// Provides a convenient and safe way for components to access the preferences context.
export function usePreferences() {
  const context = useContext(PreferencesContext);
  // Throw an error if the hook is used outside of a PreferencesProvider,
  // which helps catch setup issues early.
  if (context === null) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}