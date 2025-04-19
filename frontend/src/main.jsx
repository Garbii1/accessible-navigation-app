import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { PreferencesProvider } from './contexts/PreferencesContext'; // Ensure this exists
import App from './App.jsx';
import './index.css';

// Environment variables - Ensure these are set in Vercel/local .env files
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Also check if map key exists

if (!PUBLISHABLE_KEY) {
  console.error("Missing Clerk Publishable Key!");
  // Render error message - Consider a more styled component
  document.getElementById('root').innerHTML = `<div style="padding: 40px; font-family: sans-serif; text-align: center; color: #b91c1c;"><h1>Configuration Error</h1><p>Clerk Publishable Key is missing.</p></div>`;
} else if (!MAPS_KEY) {
   console.error("Missing Google Maps API Key!");
   document.getElementById('root').innerHTML = `<div style="padding: 40px; font-family: sans-serif; text-align: center; color: #b91c1c;"><h1>Configuration Error</h1><p>Google Maps API Key is missing.</p></div>`;
}
else {
   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <BrowserRouter>
         <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
           <PreferencesProvider>
             <App />
           </PreferencesProvider>
         </ClerkProvider>
       </BrowserRouter>
     </React.StrictMode>,
   );
}