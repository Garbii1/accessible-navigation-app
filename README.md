<p align="center">
  <img src="https://accessible-navigation-app.vercel.app/logo.png" alt="Accessible Navigation App Logo" width="400">
  <!-- Replace with the actual path to your combined logo/text image in the public folder or hosted elsewhere -->
</p>

<h1 align="center">Accessible Navigation App</h1>

<p align="center">
  An open-source, free-tier based Progressive Web App (PWA) and Web Application designed to assist individuals with disabilities in navigating public spaces more effectively, providing wheelchair-accessible routes and audio guidance.
</p>

<p align="center">
  <a href="https://accessible-navigation-app.vercel.app/"><strong>Live Demo</strong></a>
</p>

<!-- Optional Badges: Add build status, license etc. if desired -->
<!-- Example:
<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
  <img src="https://api.vercel.com/v1/badges/deploy-status?projectId=YOUR_VERCEL_PROJECT_ID&teamId=YOUR_VERCEL_TEAM_ID" alt="Vercel Status">
</p>
-->

## Overview

This project aims to create a practical navigation tool for people with mobility or visual impairments. It leverages free tiers of modern web services and open-source technologies to provide features like:

*   Route planning with accessibility filters (e.g., wheelchair accessibility, avoiding stairs).
*   Turn-by-turn audio guidance using the Web Speech API.
*   Offline capabilities through PWA service workers.
*   User location display.
*   A clean, responsive, and accessible user interface.

The goal is to build a useful tool while demonstrating proficiency in full-stack development with specific constraints (zero budget).

## Screenshot

<p align="center">
  <img src="https://accessible-navigation-app.vercel.app/homepage.jpeg" alt="Application Screenshot" width="700">
  <!-- Replace with the actual path to your homepage screenshot image -->
</p>
*(UI layout inspired by modern mapping applications for familiarity)*

## Features Implemented

*   **Route Planning:** Enter origin and destination to calculate routes via Google Maps Directions API.
*   **Accessibility Parameters:** Basic filtering passed to backend (e.g., `avoid=stairs`).
*   **Map Display:** Interactive map rendering using `@react-google-maps/api`.
*   **Route Rendering:** Displays calculated routes on the map via `DirectionsRenderer`.
*   **Text Directions:** Shows step-by-step instructions.
*   **Audio Guidance:** Reads out current/selected direction steps using Web Speech API (TTS).
*   **User Location:** Displays the user's current location on the map (requires browser permission).
*   **Responsive UI:** Adapts layout for desktop (side panel) and mobile (bottom sheet panel).
*   **PWA:** Installable as a Progressive Web App with basic offline asset caching.

## Planned / Future Features

*   **Basic Authentication Flow:** User sign-up, sign-in, profile management using Clerk (frontend components). Backend token verification setup.
*   **Authentication Integration:** Fully protect relevant backend endpoints and associate data with users.
*   **Saved Routes:** Allow authenticated users to save and reload frequently used routes.
*   **User Preferences:** Save user settings (mobility needs, default mode, voice choice) via backend API.
*   **Accessibility Data:**
    *   Integrate custom accessibility data (ramps, hazards, etc.) from MongoDB into route planning.
    *   Allow users to submit/verify accessibility points (requires moderation).
*   **Proactive Audio Guidance:** Trigger audio instructions automatically based on user proximity to the next maneuver.
*   **Offline Route Caching:** Save calculated route data (not just assets) for offline use.
*   **User Feedback Mechanism:** Implement an in-app form or link for users to report issues or suggest improvements.
*   **Enhanced Testing:** Increase unit, integration, and end-to-end test coverage. Add automated accessibility testing.
*   **Error Handling:** Implement more robust error handling (e.g., React Error Boundaries).

## Tech Stack

*   **Frontend:**
    *   React.js (with Vite)
    *   React Router DOM
    *   Tailwind CSS
    *   `@react-google-maps/api`
    *   Web Speech API (Text-to-Speech)
    *   `vite-plugin-pwa` (Workbox for Service Worker)
*   **Backend:**
    *   Flask (Python Web Framework)
    *   Gunicorn (WSGI Server)
    *   `requests` (for Google Maps API calls)
    *   `Flask-Cors`
    *   `python-dotenv`
    *   `polyline` (for decoding routes)
*   **Database:**
    *   MongoDB Atlas (Free Tier M0)
    *   `pymongo` (Python Driver)
*   **Maps & Navigation:**
    *   Google Maps Platform (Free Tier + $200 credit)
        *   Maps JavaScript API
        *   Directions API
        *   Geocoding API (Optional/Implied)
        *   Places API (Optional)
*   **Deployment:**
    *   Frontend: Vercel (Free Tier - Hobby)
    *   Backend: Render (Free Tier - Web Service)
    *   Database: MongoDB Atlas (Free Tier - M0 Cluster)

## Getting Started

Follow these instructions to set up the project locally for development.

### Prerequisites

*   Node.js (v18+ recommended) and npm/yarn
*   Python (v3.9+ recommended) and pip
*   Git
*   Accounts:
    *   Google Cloud Platform (for Maps API Keys - **Billing must be enabled**, but free tier/credit applies)
    *   MongoDB Atlas (for database)
    *   Vercel & Render (for potential deployment)
    *   GitHub (for cloning)

### Environment Setup (.env files)

**IMPORTANT:** Never commit files containing secrets (`.env`, `.env.local`) to Git. Ensure they are listed in your root `.gitignore` file.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Garbii1/accessible-navigation-app.git
    cd accessible-navigation-app
    ```

2.  **Backend (`backend/`) Setup:**
    *   Navigate to the backend directory: `cd backend`
    *   Create and activate a virtual environment:
        ```bash
        python -m venv venv
        # Windows:
        # venv\Scripts\activate
        # macOS/Linux:
        # source venv/bin/activate
        ```
    *   Install Python dependencies: `pip install -r requirements.txt`
    *   Create a `.env` file in the `backend/` directory with the following variables (replace placeholders with your actual keys/URIs):
        ```env
        MONGO_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
        GOOGLE_MAPS_API_KEY=YOUR_BACKEND_GOOGLE_MAPS_API_KEY_HERE # Restricted by IP
        FRONTEND_URL=http://localhost:5173 # Or your frontend dev port
        # Optional: FLASK_DEBUG=True # For local development only
        ```
        *   Get `MONGO_URI` from MongoDB Atlas (Database -> Connect -> Connect your application -> Python).
        *   Get `GOOGLE_MAPS_API_KEY` (Backend Key) from Google Cloud Console (restricted by IP Address).

3.  **Frontend (`frontend/`) Setup:**
    *   Navigate to the frontend directory: `cd ../frontend` (from backend) or `cd frontend` (from root)
    *   Install Node dependencies: `npm install` (or `yarn install`)
    *   Create a `.env.local` file in the `frontend/` directory (this file is ignored by Git and overrides `.env`):
        ```env
        # Local development environment variables

        # URL for the LOCAL backend API (ensure port matches backend setup)
        VITE_API_BASE_URL=http://localhost:5001

        # Your Google Maps JavaScript API Key (Frontend Key)
        # Ensure localhost:PORT is added to HTTP referrers in Google Cloud Console
        VITE_GOOGLE_MAPS_API_KEY=YOUR_FRONTEND_GOOGLE_MAPS_API_KEY_HERE
        ```
        *   Get `VITE_GOOGLE_MAPS_API_KEY` (Frontend Key) from Google Cloud Console (restricted by HTTP Referrers).

### Running Locally

1.  **Start Backend Server:**
    *   Open a terminal in the `backend/` directory.
    *   Activate the virtual environment (`source venv/bin/activate` or `venv\Scripts\activate`).
    *   Run the Flask development server: `python app.py` (It should run on the port specified in `VITE_API_BASE_URL`, e.g., 5001).
2.  **Start Frontend Dev Server:**
    *   Open *another* terminal in the `frontend/` directory.
    *   Run the Vite dev server: `npm run dev` (Usually runs on port 5173).
    *   Open your browser to `http://localhost:5173`.

## API Endpoints Overview (Backend)

*(Assuming Blueprint structure)*

*   **Navigation (`/api/route`)**
    *   `POST /`: Calculates route based on origin, destination, preferences.
*   **User Data (`/api`)**
    *   `POST /routes`: Saves a route for the logged-in user. (`@require_auth`)
    *   `GET /routes`: Gets a list of saved routes for the logged-in user. (`@require_auth`)
    *   `GET /routes/<route_id>`: Gets details of a specific saved route. (`@require_auth`)
    *   `DELETE /routes/<route_id>`: Deletes a saved route. (`@require_auth`)
    *   `GET /user/preferences`: Gets preferences for the logged-in user. (`@require_auth`)
    *   `PUT /user/preferences`: Updates preferences for the logged-in user. (`@require_auth`)
*   **Accessibility Data (`/api/accessibility-points`)**
    *   `POST /`: Adds a new accessibility point report. (`@require_auth`)
    *   `GET /`: Gets accessibility points near a given lat/lng (Public).
    *   `GET /<point_id>`: Gets details of a specific accessibility point (Public).

## Deployment

*   **Frontend (Vercel):**
    *   Connect your GitHub repository to Vercel.
    *   Configure the **Root Directory** to `frontend`.
    *   Set the **Framework Preset** to `Vite`.
    *   Add the necessary **Environment Variables** (`VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_API_KEY`) for the Production environment in the Vercel project settings.
*   **Backend (Render):**
    *   Connect your GitHub repository to Render as a "Web Service".
    *   Ensure `requirements.txt` and `Procfile` are present in the `backend/` directory.
    *   Render should detect Python and use `pip install -r requirements.txt` for build and `gunicorn app:app --log-file=-` for start command (from `Procfile`).
    *   Add the necessary **Environment Variables** (`MONGO_URI`, `GOOGLE_MAPS_API_KEY`, `FRONTEND_URL`) in the Render service settings.
    *   Ensure Render's outbound IP addresses are allowed in MongoDB Atlas Network Access rules.
*   **Database (MongoDB Atlas):**
    *   Use the free M0 shared cluster.
    *   Configure Network Access to allow connections from Render and your local IP for testing.

## Challenges Faced & Solutions

*   **Google Maps API Keys:** Ensuring correct restrictions (HTTP Referrers for Frontend Key, IP Addresses for Backend Key) and enabling the necessary APIs (Maps JavaScript, Directions) for each key was crucial. The `RefererNotAllowedMapError` specifically required adding Vercel preview deployment URLs to the allowed referrers.
*   **CORS:** Configuring the Flask backend (`Flask-Cors`) to allow requests from the specific frontend origin (localhost for dev, Vercel URL for prod) using the `FRONTEND_URL` environment variable was necessary. Also ensuring the frontend correctly requested paths starting with `/api/`.
*   **Service Worker Caching:** Encountered issues with the PWA service worker caching empty files. Resolved by ensuring the build process completed without errors. Also fixed a runtime error in the service worker by correctly embedding the `VITE_API_BASE_URL` string during build time using `loadEnv` in `vite.config.js`, rather than trying to access `import.meta.env` at runtime within the worker. Aggressive browser cache/service worker clearing was needed during debugging.
*   **Private npm Packages (If Applicable):** Required setting up `NPM_TOKEN` environment variable in Vercel/Render and configuring `.npmrc` in the project to authenticate with the private registry during build.

## Author

*   **Muhammed Babatunde Garuba**
*   GitHub: [@Garbii1](https://github.com/Garbii1)

## License

This project is licensed under the MIT License.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<!-- Or use the actual MIT license image if you have one -->