// src/pages/UserProfilePage.jsx
import React from 'react';
import { UserProfile } from '@clerk/clerk-react';

function UserProfilePage() {
  return (
    // Add padding/margin to position it within the TopBarLayout's main area
    <div className="flex justify-center items-start py-10 px-4">
      <UserProfile path="/profile" routing="path" appearance={{
          elements: {
              card: "shadow-xl border border-gray-200",
              navbar: "hidden",
              headerTitle: "text-gray-800",
          }
      }}/>
    </div>
  );
}
export default UserProfilePage;