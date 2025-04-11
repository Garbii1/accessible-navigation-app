import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

// Create the context
const AuthContext = createContext(null);

// Placeholder for actual API calls to login/logout/verify token
const authService = {
  login: async (username, password) => {
    console.log("Simulating login for:", username);
    // Replace with actual API call: POST /api/auth/login
    await new Promise(res => setTimeout(res, 500)); // Simulate network delay
    // On success, API should return user data and a token
    if (username === 'test' && password === 'pass') {
      return { user: { id: 'user123', name: 'Test User', email: 'test@example.com' }, token: 'fake-jwt-token' };
    }
    throw new Error("Invalid credentials");
  },
  logout: async () => {
    console.log("Simulating logout");
    // Replace with actual API call: POST /api/auth/logout (if needed)
    await new Promise(res => setTimeout(res, 200));
  },
  verifyToken: async (token) => {
    console.log("Simulating token verification");
     // Replace with actual API call: GET /api/auth/me or token validation logic
    await new Promise(res => setTimeout(res, 300));
    if (token === 'fake-jwt-token') {
        return { user: { id: 'user123', name: 'Test User', email: 'test@example.com' } };
    }
    return null; // Token invalid or expired
  }
};

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken')); // Load token from storage initially
  const [isLoading, setIsLoading] = useState(true); // Start loading until token verified
  const [error, setError] = useState(null);

  // Effect to verify token on initial load or when token changes
  useEffect(() => {
    const verifyCurrentUser = async () => {
      if (token) {
        setIsLoading(true);
        setError(null);
        try {
          const data = await authService.verifyToken(token);
          if (data?.user) {
             setUser(data.user);
          } else {
             // Token invalid or expired
             localStorage.removeItem('authToken');
             setToken(null);
             setUser(null);
          }
        } catch (err) {
           console.error("Token verification failed:", err);
           localStorage.removeItem('authToken');
           setToken(null);
           setUser(null);
           // Optionally set an error state here
        } finally {
           setIsLoading(false);
        }
      } else {
        setIsLoading(false); // No token, not loading
      }
    };
    verifyCurrentUser();
  }, [token]);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(username, password);
      if (data?.user && data?.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('authToken', data.token); // Store token
      } else {
         throw new Error("Login failed: No user or token received.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed.");
      throw err; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
      // Still proceed with client-side logout even if server call fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken'); // Clear token
      setIsLoading(false);
      // Optional: redirect to login page
      console.log("User logged out");
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user, // Boolean flag
    isLoading,
    error,
    login,
    logout,
  }), [user, token, isLoading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}