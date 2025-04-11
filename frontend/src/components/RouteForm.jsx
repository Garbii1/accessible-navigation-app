// src/components/RouteForm.jsx
import React, { useState } from 'react';

const RouteForm = ({ onSubmit, isLoading }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSubmit = (e) => {
     e.preventDefault();
     onSubmit(origin, destination);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... rest of the form JSX ... */}
       <div>
         <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
         <input
           type="text" id="origin" name="origin" value={origin} onChange={(e) => setOrigin(e.target.value)}
           placeholder="Enter starting address or place" required
           aria-required="true"
           className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
         />
      </div>
      <div>
         <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
         <input
            type="text" id="destination" name="destination" value={destination} onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination address or place" required
            aria-required="true"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
         />
      </div>
      <button type="submit" disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white font-bold py-2.5 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2">
         {isLoading && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
         )}
        {isLoading ? 'Calculating...' : 'Get Accessible Route'}
      </button>
    </form>
  );
};

export default RouteForm; // Add the export statement