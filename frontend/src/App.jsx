// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useAuth, SignInButton, SignUpButton, RedirectToSignIn } from '@clerk/clerk-react';

// --- Import Pages ---
import HomePage from './pages/HomePage';
import SavedRoutesPage from './pages/SavedRoutesPage';
import PreferencesPage from './pages/PreferencesPage';
import UserProfilePage from './pages/UserProfilePage'; // For Clerk's <UserProfile />

// --- Hamburger Menu Component ---
function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { isSignedIn } = useAuth();
    const location = useLocation(); // To close menu on navigation

    const toggleMenu = (e) => {
        e.stopPropagation(); // Prevent background click when opening
        setIsOpen(!isOpen);
    };
    const closeMenu = () => setIsOpen(false);

    // Close menu when route changes
    useEffect(() => {
        closeMenu();
    }, [location.pathname]);

    return (
        <div className="relative z-50">
            {/* Hamburger Button */}
            <button
                onClick={toggleMenu}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-label="Open main menu"
                aria-controls="main-menu"
                aria-expanded={isOpen}
            >
                {/* Heroicon: menu */}
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Menu Panel (Dropdown/Slide-in) */}
            {isOpen && (
                 <div // Background overlay
                    className="fixed inset-0 bg-black bg-opacity-10 z-40"
                    onClick={closeMenu}
                    aria-hidden="true"
                 ></div>
             )}
            <div
                 id="main-menu"
                 className={`absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transform transition ease-out duration-150 ${isOpen ? 'opacity-100 scale-100 z-50' : 'opacity-0 scale-95 pointer-events-none'}`}
                 role="menu" aria-orientation="vertical" tabIndex="-1">
                <div className="py-1 divide-y divide-gray-100" role="none">
                    {/* Section 1: Core Navigation */}
                    <div className="px-4 py-3">
                        <p className="text-sm text-gray-500">Navigation</p>
                    </div>
                    <Link to="/" className="text-gray-700 group flex items-center px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={closeMenu}>
                       {/* Heroicon: map */}
                       <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12 1.586l-4 4V4a2 2 0 10-4 0v12a2 2 0 104 0V8.414l4 4V16a2 2 0 104 0V4a2 2 0 10-4 0v-.414zM14 4a1 1 0 10-2 0v12a1 1 0 102 0V4zM4 16a1 1 0 100 2 1 1 0 000-2zM6 4a1 1 0 10-2 0v12a1 1 0 102 0V4z" clipRule="evenodd" /></svg>
                       Map / Plan Route
                    </Link>

                    {/* Section 2: User Specific */}
                    <SignedIn>
                        <div className="px-4 py-3">
                            <p className="text-sm text-gray-500">My Account</p>
                        </div>
                        <Link to="/saved-routes" className="text-gray-700 group flex items-center px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={closeMenu}>
                            {/* Heroicon: bookmark */}
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                           Saved Routes
                        </Link>
                        <Link to="/preferences" className="text-gray-700 group flex items-center px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={closeMenu}>
                            {/* Heroicon: cog */}
                           <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                           Preferences
                        </Link>
                         <Link to="/profile" className="text-gray-700 group flex items-center px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={closeMenu}>
                             {/* Heroicon: user-circle */}
                             <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                           My Profile
                        </Link>
                         {/* UserButton provides Sign Out */}
                         <div className="px-4 py-3">
                            <UserButton showName afterSignOutUrl="/" appearance={{ elements: { userButtonTrigger: "focus:ring-0 focus:outline-none text-sm"} }}/>
                         </div>
                    </SignedIn>

                    {/* Section 3: Auth Actions */}
                    <SignedOut>
                        <div className="px-4 py-3">
                            <p className="text-sm text-gray-500">Account</p>
                        </div>
                        <SignInButton mode="modal" redirectUrl="/">
                             <button className="text-gray-700 group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={closeMenu}>
                                 {/* Heroicon: login */}
                                <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                               Sign In
                             </button>
                        </SignInButton>
                        <SignUpButton mode="modal" redirectUrl="/">
                             <button className="text-gray-700 group flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={closeMenu}>
                                 {/* Heroicon: user-add */}
                                <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                               Sign Up
                             </button>
                        </SignUpButton>
                    </SignedOut>
                </div>
            </div>
        </div>
    );
}

// --- Minimal Layout Component for Top Bar ---
function TopBarLayout() {
     return (
        <div className="relative min-h-screen"> {/* Ensure layout takes full height */}
             {/* Header for Title and Menu - positioned over the map */}
             <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-white via-white/80 to-white/0 pt-4 pb-8 px-4 sm:px-6 lg:px-8 pointer-events-none">
                 <div className="container mx-auto flex justify-between items-start max-w-none"> {/* Max-width none for full width container */}
                      {/* Invisible placeholder to balance title if needed, or adjust title centering */}
                     <div className="w-8 h-8 opacity-0 flex-shrink-0"></div>
                     {/* Centered Title (adjust text-center if needed) */}
                     <h1 className="text-xl sm:text-2xl font-bold text-indigo-700 tracking-tight pointer-events-auto pt-1 text-center flex-grow mx-4">
                         Accessible Navigation
                     </h1>
                      {/* Hamburger Menu */}
                     <div className="pointer-events-auto flex-shrink-0">
                        <HamburgerMenu />
                     </div>
                 </div>
             </header>
            {/* Outlet renders the actual page content (HomePage etc.) which will include the map filling the space */}
            <Outlet />
        </div>
     );
}

// --- Protected Route Component ---
function ProtectedRoute({ children }) {
  const { userId, isLoaded } = useAuth();
  if (!isLoaded) {
      return (
          <div className="h-screen flex justify-center items-center">
               {/* Add a loading spinner here */}
               Loading session...
           </div>
      );
  }
  if (!userId) return <RedirectToSignIn />;
  return children;
}

// --- App Component with Routes ---
function App() {
  return (
    // Context Providers should ideally be in main.jsx if they wrap the whole app
    // <PreferencesProvider>
        <Routes>
            {/* Use TopBarLayout for main map view and potentially other pages */}
            <Route element={<TopBarLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/saved-routes" element={ <ProtectedRoute> <SavedRoutesPage /> </ProtectedRoute> } />
                <Route path="/preferences" element={ <ProtectedRoute> <PreferencesPage /> </ProtectedRoute> } />
                <Route path="/profile" element={ <ProtectedRoute> <UserProfilePage /> </ProtectedRoute> } />
            </Route>

            {/* Fallback 404 Route (no layout) */}
            <Route path="*" element={
                <div className="min-h-screen flex flex-col justify-center items-center">
                    <h2 className='text-2xl font-semibold mb-4'>404: Page Not Found</h2>
                    <Link to="/" className='text-indigo-600 hover:underline'>Go Home</Link>
                </div>
            } />
        </Routes>
    // </PreferencesProvider>
  );
}

export default App;