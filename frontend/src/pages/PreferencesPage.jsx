// src/pages/PreferencesPage.jsx
import React from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import PreferenceToggle from '../components/PreferenceToggle';
import LoadingSpinner from '../components/LoadingSpinner';

function PreferencesPage() {
  const { preferences, isLoading, error: contextError, updatePreferences, reloadPreferences } = usePreferences();

  const handlePreferenceChange = (event) => {
    const { name, type, checked, value } = event.target;
    const newValue = type === 'checkbox' ? checked : value;
    updatePreferences({ [name]: newValue });
  };

  // Display loading indicator while context is loading
  if (isLoading) {
     return (
         <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">My Preferences</h2>
             <LoadingSpinner message="Loading preferences..." />
         </div>
     );
  }

  return (
    // Add padding/margin to position it within the TopBarLayout's main area
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">My Preferences</h2>

      {/* Display context loading/saving error */}
      {contextError && (
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm mb-4" role="alert">
             <strong className="font-bold">Error: </strong>
             <span>{contextError}</span>
             {reloadPreferences && ( // Show retry only if context provides it
                <button
                    onClick={reloadPreferences}
                    className="ml-4 text-sm text-red-800 underline hover:text-red-900"
                >
                    Retry Loading
                </button>
             )}
         </div>
      )}

      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-gray-100">
         <fieldset>
             <legend className="text-lg font-medium text-gray-900 mb-3">Accessibility</legend>
             <div className="space-y-3 pl-2">
                <div>
                     <label htmlFor="mobilitySelect" className="block text-sm font-medium text-gray-700 mb-1">Default Mobility Need:</label>
                     <select
                         id="mobilitySelect" name="defaultMobility"
                         value={preferences?.defaultMobility || 'standard'}
                         onChange={handlePreferenceChange}
                         className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                     >
                         <option value="standard">Standard</option>
                         <option value="wheelchair">Wheelchair User</option>
                     </select>
                     <p className="text-xs text-gray-500 mt-1">Select your primary mobility type.</p>
                 </div>
                 <PreferenceToggle
                    label="Avoid Stairs (Walking)" name="avoidStairs"
                    checked={preferences?.avoidStairs ?? true}
                    onChange={handlePreferenceChange}
                    description="Prioritize routes using ramps or elevators."
                 />
                  <PreferenceToggle
                    label="Prefer Wheelchair Accessible (Transit)" name="wheelchairAccessibleTransit"
                    checked={preferences?.wheelchairAccessibleTransit ?? true}
                    onChange={handlePreferenceChange}
                    description="Request known accessible transit routes (may limit options)."
                 />
             </div>
         </fieldset>

         <fieldset>
             <legend className="text-lg font-medium text-gray-900 mb-3">General</legend>
             <div className="space-y-3 pl-2">
                <div>
                     <label htmlFor="modeSelectPref" className="block text-sm font-medium text-gray-700 mb-1">Default Travel Mode:</label>
                     <select
                         id="modeSelectPref" name="mode"
                         value={preferences?.mode || 'walking'}
                         onChange={handlePreferenceChange}
                         className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                     >
                         <option value="walking">Walking</option>
                         <option value="transit">Transit</option>
                         {/* <option value="driving">Driving</option> */}
                     </select>
                     <p className="text-xs text-gray-500 mt-1">Your preferred mode for planning routes.</p>
                 </div>
                 {/* Voice selection could go here if implemented, see previous notes */}
             </div>
         </fieldset>
         {/* No explicit save button needed with autosave approach */}
      </div>
    </div>
  );
}

export default PreferencesPage;