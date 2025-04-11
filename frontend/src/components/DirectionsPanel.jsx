// src/components/DirectionsPanel.jsx
import React from 'react';

// Helper function to safely strip HTML for use in aria-labels
// Avoids errors if step.html_instructions is null or undefined
const stripHtmlForLabel = (html) => {
    if (!html) return "";
    try {
        // Use a more robust method or a library if complex HTML is expected,
        // but for simple Google Directions HTML, this is usually sufficient.
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    } catch (e) {
        console.error("Error stripping HTML:", e);
        return ""; // Return empty string on error
    }
}

function DirectionsPanel({ route, onStepSelect }) {
   // --- Safety Checks ---
   // Check if route and the necessary nested properties exist
   if (!route || !route.legs || !route.legs[0] || !route.legs[0].steps) {
       // Optionally log the invalid route object for debugging
       // console.warn("DirectionsPanel received invalid route data:", route);

       // Provide a user-friendly message or render nothing
       // Depending on App.jsx structure, this might not even be rendered if route is null
       return (
           <div className="mt-4 border-t border-gray-200 pt-4">
               <p className="text-sm text-center text-gray-500">
                   Direction details are currently unavailable.
               </p>
           </div>
       );
   }

   // Get the first leg of the route (assuming single-leg routes for now)
   const leg = route.legs[0];

   // --- Render Logic ---
   return (
      <div className="space-y-4"> {/* Add spacing around the panel elements */}
         <h3 className="text-xl font-semibold text-gray-800">Directions</h3>

         {/* Display Summary Info */}
         <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
            <p>
                <span className="font-medium text-gray-700">Total Distance:</span> {leg.distance?.text || 'N/A'}
            </p>
            <p>
                <span className="font-medium text-gray-700">Approx. Duration:</span> {leg.duration?.text || 'N/A'}
            </p>
            {/* Optionally display start/end addresses if available */}
            {/* <p><span className="font-medium">From:</span> {leg.start_address}</p> */}
            {/* <p><span className="font-medium">To:</span> {leg.end_address}</p> */}
         </div>

         {/* List of Steps */}
         <ol className="space-y-1" aria-label="Route directions steps">
            {leg.steps.map((step, index) => (
               <li key={index}
                   className="p-3 rounded-md hover:bg-indigo-50 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:bg-indigo-50 cursor-pointer transition-colors border border-transparent hover:border-indigo-100"
                   onClick={() => onStepSelect(step)} // Call prop function on click
                   role="button" // Indicate it's interactive
                   tabIndex={0} // Make it focusable
                   // Provide a descriptive label for screen readers
                   aria-label={`Step ${index + 1}: ${stripHtmlForLabel(step.html_instructions)}. Distance: ${step.distance?.text || ''}`}
                   // Allow activation with Enter or Space keys for accessibility
                   onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onStepSelect(step)}
                >
                 {/* Use dangerouslySetInnerHTML carefully for Google's HTML instructions */}
                 {/* Add fallback text if instructions are missing */}
                 <div
                    className="text-sm text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step.html_instructions || '<i>Instruction not available.</i>' }}
                 />
                 {/* Display distance for the step */}
                 {step.distance?.text && (
                    <span className="text-xs text-indigo-700 font-medium mt-1 block">
                        {step.distance.text}
                    </span>
                 )}
                 {/* Optional: Display duration for the step */}
                 {/* {step.duration?.text && (
                    <span className="text-xs text-gray-500 font-medium mt-1 block">({step.duration.text})</span>
                 )} */}
               </li>
            ))}
         </ol>
      </div>
   );
}

export default DirectionsPanel;