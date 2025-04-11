import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext'; // Import AuthContext hook
// import { useNavigate } from 'react-router-dom'; // Import if using React Router for redirection

function LoginPage() {
  // const { login, isLoading, error } = useAuth(); // Get login function and state from context
  // const navigate = useNavigate(); // For redirection after login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Placeholder states for when context is not used
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log("Attempting login with:", username);
    // --- Replace with context login ---
    // try {
    //   await login(username, password);
    //   navigate('/'); // Redirect to home page on success (if using router)
    // } catch (err) {
    //   // Error state is already set within the login function in context
    //   console.error("Login page caught error:", err);
    // } finally {
    //   setIsLoading(false); // isLoading state is also handled by context
    // }
    // --- End Replace ---

    // --- Placeholder Logic ---
    await new Promise(res => setTimeout(res, 600));
    if (username === 'test' && password === 'pass') {
        console.log('Placeholder login success');
        // navigate('/'); // Placeholder redirect
    } else {
        setError('Placeholder: Invalid credentials');
    }
    setIsLoading(false);
     // --- End Placeholder ---
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="p-8 bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username/Email
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              disabled={isLoading}
            />
          </div>

          {error && (
             <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-bold py-2.5 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {/* Add links for registration or password reset if needed */}
      </div>
    </div>
  );
}

export default LoginPage;