// src/contexts/PreferencesContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
// Import REAL API functions - Make sure these exist and work with tokens
import { getUserPreferences, updateUserPreferences } from '../services/api';
// Import Clerk hook to get user ID and token
import { useAuth } from '@clerk/clerk-react';

// --- Create the Context ---
// The initial value is null, consumers must be descendants of the Provider.
const PreferencesContext = createContext(null);

// --- Default Preferences Structure ---
// Define the shape and default values for user preferences.
const defaultPreferences = {
  defaultMobility: 'standard', // 'standard' or 'wheelchair'
  voiceURI: null,             // Store selected voice URI string (or null for browser default)
  avoidStairs: true,          // Walking routes: try to avoid stairs
  wheelchairAccessibleTransit: true, // Transit routes: request accessible ones
  mode: 'walking',            // Default travel mode ('walking', 'transit', 'driving'?)
  // Add other potential preferences here:
  // e.g., preferredUnits: 'metric' / 'imperial'
  // e.g., mapType: 'roadmap' / 'satellite'
};

// --- Preferences Provider Component ---
// This component wraps parts of the app that need access to preferences.
// It fetches, stores, and updates user preferences.
export function PreferencesProvider({ children }) {
  // State for the actual preferences object
  const [preferences, setPreferences] = useState(defaultPreferences);
  // State to track loading status
  const [isLoading, setIsLoading] = useState(true);
  // State to store errors during load/save operations
  const [error, setError] = useState(null);
  // Get authentication state from Clerk using its hook
  const { userId, getToken, isSignedIn, isLoaded: isAuthLoaded } = useAuth();

  // --- Function to Load Preferences from Backend ---
  const loadPrefs = useCallback(async () => {
    // Only attempt to load if Clerk has determined auth status AND user is signed in
    if (!isSignedIn || !userId) {
      setPreferences(defaultPreferences); // Reset to defaults if not signed in
      setIsLoading(false); // No longer loading if not signed in
      setError(null); // Clear any previous errors
      console.log("PreferencesContext: User not signed in, using default preferences.");
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`PreferencesContext: Attempting to load preferences for user ${userId}`);

    try {
      const token = await getToken(); // Get the session token from Clerk
      if (!token) {
          // This case might happen briefly during sign-in/out transitions
          throw new Error("Authentication token not available.");
      }

      const loadedPrefs = await getUserPreferences(token); // Call the API service function
      // Merge fetched preferences with defaults to ensure all keys exist
      // Fetched preferences override defaults.
      setPreferences(prev => ({ ...defaultPreferences, ...prev, ...loadedPrefs }));
      console.log("PreferencesContext: Preferences loaded successfully:", loadedPrefs);
    } catch (err) {
      console.error("PreferencesContext: Failed to load preferences:", err);
      setError(`Could not load preferences: ${err.message}. Using defaults.`);
      setPreferences(defaultPreferences); // Fallback to defaults on error
    } finally {
      setIsLoading(false);
    }
    // Dependencies: Trigger reload if user ID changes or if getToken becomes available/changes
  }, [userId, isSignedIn, getToken]);

  // --- Effect to Load Preferences ---
  // Runs when auth status is determined or when the load function itself changes (rarely)
  useEffect(() => {
    if (isAuthLoaded) { // Ensure Clerk is ready before trying to load
      loadPrefs();
    }
  }, [isAuthLoaded, loadPrefs]); // Depend on auth load status and the memoized load function

  // --- Function to Update and Save Preferences ---
  const updatePreferences = useCallback(async (newPrefs) => {
    // Prevent saving if not authenticated
    if (!isSignedIn || !userId) {
       console.warn("PreferencesContext: Cannot save preferences, user not authenticated.");
       setError("You must be logged in to save preferences.");
       // Optionally, revert the local state change if you used optimistic updates differently
       return;
    }

    // Create the next state optimistically for immediate UI feedback
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    setError(null); // Clear previous errors on a new save attempt

    console.log(`PreferencesContext: Attempting to save preferences for user ${userId}:`, updatedPrefs);

    try {
        const token = await getToken(); // Get fresh token for saving
        if (!token) throw new Error("Authentication token unavailable for saving.");

        // Call the API to persist the changes
        await updateUserPreferences(updatedPrefs, token); // Pass the *entire* updated object
        console.log("PreferencesContext: Preferences saved successfully.");
    } catch (err) {
        console.error("PreferencesContext: Failed to save preferences:", err);
        setError(`Failed to save preferences: ${err.message}. Changes might not persist.`);
        // Optional: Revert the optimistic update by reloading saved prefs
        // Consider adding a delay or specific UI indication for the revert
        // loadPrefs();
        // Or simply notify the user the save failed.
    }
    // Dependencies: Include necessary state/functions used inside
  }, [userId, preferences, isSignedIn, getToken]); // Removed loadPrefs dependency if not reverting

  // --- Memoize the Context Value ---
  // Prevents consumers from re-rendering unnecessarily if the context object identity changes
  // but the actual values they care about haven't.
  const value = useMemo(() => ({
    preferences,
    isLoading,
    error,
    updatePreferences,
    reloadPreferences: loadPrefs, // Provide a way for consumers to manually reload
  }), [preferences, isLoading, error, updatePreferences, loadPrefs]); // Include all returned values/functions

  // --- Provide the Context ---
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider> // Ensure closing tag is correct
  ); // Ensure closing parenthesis for return is correct
} // Ensure closing brace for function is correct

// --- Custom Hook for Consuming the Context ---
// Provides a cleaner way for components to access the context values.
export function usePreferences() {
  const context = useContext(PreferencesContext);
  // Ensure the hook is used within a provider
  if (context === null) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}