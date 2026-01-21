import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';
import "leaflet/dist/leaflet.css";
/* If you installed leaflet.markercluster and want cluster CSS: */
import "maplibre-gl/dist/maplibre-gl.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

// import React from "react";
// import { createRoot } from "react-dom/client";
// import App from "./App";
// import "./index.css";

// const container = document.getElementById("root");
// if (!container) throw new Error("Root element not found");
// createRoot(container).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
