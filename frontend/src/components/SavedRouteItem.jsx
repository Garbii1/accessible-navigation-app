import React from 'react';

// Example component to display a single saved route in a list
function SavedRouteItem({ route, onSelect, onDelete }) {
  if (!route) {
    return null;
  }

  // Basic formatting for display
  const originName = route.origin?.address || `Lat: ${route.origin?.lat?.toFixed(4)}, Lng: ${route.origin?.lng?.toFixed(4)}`;
  const destName = route.destination?.address || `Lat: ${route.destination?.lat?.toFixed(4)}, Lng: ${route.destination?.lng?.toFixed(4)}`;
  const createdAtDate = route.createdAt ? new Date(route.createdAt).toLocaleDateString() : 'N/A';

  const handleSelect = (e) => {
     e.stopPropagation(); // Prevent triggering delete if select is main action
     if (onSelect) onSelect(route._id);
  };

  const handleDelete = (e) => {
     e.stopPropagation(); // Prevent select if delete is clicked
     if (onDelete) onDelete(route._id);
  };

  return (
    <li
      className="p-3 hover:bg-gray-50 border border-transparent rounded-md flex justify-between items-center group transition-colors duration-150 ease-in-out"
    >
      <button
        onClick={handleSelect}
        className="flex-grow text-left focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-md -m-1 p-1" // Negative margin for larger focus area
        aria-label={`Load route named ${route.name || 'Unnamed Route'}`}
      >
        <p className="text-sm font-medium text-indigo-600 truncate group-hover:text-indigo-800">
          {route.name || 'Unnamed Route'}
        </p>
        <p className="text-xs text-gray-500 truncate" title={`From: ${originName} To: ${destName}`}>
          {originName} → {destName}
        </p>
        <p className="text-xs text-gray-400">Saved: {createdAtDate}</p>
      </button>
      {onDelete && (
        <button
          onClick={handleDelete}
          className="ml-3 p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full"
          aria-label={`Delete route ${route.name || 'Unnamed Route'}`}
          title="Delete route"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </li>
  );
}

export default SavedRouteItem;