import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
// Import API service functions (assuming they exist)
// import { getUserPreferences, updateUserPreferences } from '../services/api';
// Import auth context if preferences are user-specific
// import { useAuth } from './AuthContext';

// --- Placeholder API calls ---
const preferencesService = {
    load: async (userId) => {
        console.log(`Simulating load preferences for user ${userId}`);
        await new Promise(res => setTimeout(res, 400));
        // Simulate loading saved prefs or returning defaults
        const saved = localStorage.getItem(`prefs_${userId}`);
        if (saved) return JSON.parse(saved);
        return { defaultMobility: 'standard', voiceURI: null, avoidStairs: true };
    },
    save: async (userId, prefs) => {
        console.log(`Simulating save preferences for user ${userId}:`, prefs);
        await new Promise(res => setTimeout(res, 300));
        // Simulate saving (e.g., to local storage for demo)
        localStorage.setItem(`prefs_${userId}`, JSON.stringify(prefs));
        // Replace with actual API call: PUT /api/user/preferences
        return true;
    }
};
// --- End Placeholder ---


// Create the context
const PreferencesContext = createContext(null);

// Default preferences
const defaultPreferences = {
  defaultMobility: 'standard', // 'standard' or 'wheelchair'
  voiceURI: null, // Store selected voice URI string
  avoidStairs: true, // Example walking preference
  // Add other preferences as needed
};

// Provider component
export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { user, isAuthenticated } = useAuth(); // Get user from AuthContext if prefs are user-specific

  // Placeholder user ID - replace with actual user ID from auth context
  const userId = 'temp_user_id_for_testing'; // Replace with user?.id;

  // Load preferences on mount or when user changes
  useEffect(() => {
    const loadPrefs = async () => {
      // if (!isAuthenticated || !userId) { // Only load if authenticated
      //   setPreferences(defaultPreferences);
      //   setIsLoading(false);
      //   return;
      // }
      setIsLoading(true);
      setError(null);
      try {
        const loadedPrefs = await preferencesService.load(userId);
        setPreferences(prev => ({ ...defaultPreferences, ...prev, ...loadedPrefs })); // Merge with defaults
      } catch (err) {
        console.error("Failed to load preferences:", err);
        setError("Could not load preferences.");
        setPreferences(defaultPreferences); // Fallback to defaults
      } finally {
        setIsLoading(false);
      }
    };
    loadPrefs();
  }, [userId]); // Reload if userId changes (i.e., user logs in/out)

  // Function to update and save preferences
  const updatePreferences = useCallback(async (newPrefs) => {
    // if (!isAuthenticated || !userId) {
    //    console.warn("Cannot save preferences, user not authenticated.");
    //    return; // Don't save if not logged in
    // }
    // Optimistic UI update
    setPreferences(prev => ({ ...prev, ...newPrefs }));
    setError(null); // Clear previous errors on new attempt
    try {
        await preferencesService.save(userId, { ...preferences, ...newPrefs }); // Save merged state
        console.log("Preferences saved successfully.");
    } catch (err) {
        console.error("Failed to save preferences:", err);
        setError("Failed to save preferences. Changes may not persist.");
        // Optionally revert optimistic update here if needed
        // loadPrefs(); // Re-fetch to revert?
    }
  }, [userId, preferences]); // Include dependencies

  // Memoize the context value
  const value = useMemo(() => ({
    preferences,
    isLoading,
    error,
    updatePreferences,
  }), [preferences, isLoading, error, updatePreferences]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

// Custom hook to use the preferences context
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === null) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}