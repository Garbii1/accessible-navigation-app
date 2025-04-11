import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue) {
  // Function to get the initial state from localStorage or use the initialValue
  const readValue = useCallback(() => {
    // Prevent build error/warning if running on server (e.g., SSR)
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // State to store our value
  const [storedValue, setStoredValue] = useState(readValue);

  // Wrapper around useState's setter function that persists the new value to localStorage.
  const setValue = useCallback((value) => {
    // Prevent build error/warning if running on server
    if (typeof window === 'undefined') {
      console.warn(`Tried setting localStorage key “${key}” even though environment is not a client`);
    }
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  // Effect to listen for storage changes from other tabs/windows (optional)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.storageArea === window.localStorage) {
         try {
            setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
         } catch (error) {
            console.warn(`Error parsing storage change for key “${key}”:`, error);
         }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]); // readValue is stable, no need to include

  // Effect to update state if initialValue changes (optional, depends on use case)
   useEffect(() => {
     setStoredValue(readValue());
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [key]); // Re-read if key changes

  return [storedValue, setValue];
}

export default useLocalStorage;