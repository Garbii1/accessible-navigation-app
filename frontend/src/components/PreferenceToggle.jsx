import React from 'react';

// Example component for a user preference toggle
function PreferenceToggle({ label, name, checked, onChange, description = null }) {
  const id = `pref-${name}`;
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center h-5">
         <input
           id={id}
           name={name}
           type="checkbox"
           checked={checked}
           onChange={onChange}
           className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded transition duration-150 ease-in-out"
         />
      </div>
      <div className="text-sm">
         <label htmlFor={id} className="font-medium text-gray-700 cursor-pointer select-none">
           {label}
         </label>
         {description && <p className="text-gray-500 text-xs">{description}</p>}
      </div>
    </div>
  );
}

export default PreferenceToggle;