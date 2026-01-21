// import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
// import L from "leaflet";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import "leaflet/dist/leaflet.css";

// import truckImg from "../assets/truck.png";

// /* ===============================
//    API
// ================================ */
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// /* ===============================
//    TYPES
// ================================ */
// interface LiveAsset {
//   asset_id: string;
//   device_id: string;
//   location: {
//     latitude: number;
//     longitude: number;
//   };
//   inside_geofence: boolean;
//   geofence: {
//     base_latitude: number;
//     base_longitude: number;
//     radius_meters: number;
//     distance_meters: number;
//   };
//   heading?: number; // degrees
//   updated_at: string;
// }

// /* ===============================
//    TRUCK ICON (ROTATABLE)
// ================================ */
// const truckIcon = (
//   heading = 0,
//   insideGeofence = true
// ) =>
//   L.divIcon({
//     className: "",
//     html: `
//       <div style="
//         width: 36px;
//         height: 36px;
//         transform: rotate(${heading}deg);
//         transition: transform 0.4s linear;
//         filter: ${
//           insideGeofence
//             ? "drop-shadow(0 0 4px green)"
//             : "drop-shadow(0 0 4px red)"
//         };
//       ">
//         <img
//           src="${truckImg}"
//           style="width:100%; height:100%;"
//         />
//       </div>
//     `,
//     iconSize: [36, 36],
//     iconAnchor: [18, 18],
//   });

// /* ===============================
//    BASE LOCATION ICON
// ================================ */
// const baseIcon = L.divIcon({
//   className: "",
//   html: `<div style="font-size:22px">📍</div>`,
//   iconSize: [24, 24],
//   iconAnchor: [12, 24],
// });

// /* ===============================
//    COMPONENT
// ================================ */
// export default function MapPage() {
//   const [assets, setAssets] = useState<LiveAsset[]>([]);

//   useEffect(() => {
//     fetchLiveAssets();
//     const interval = setInterval(fetchLiveAssets, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchLiveAssets = async () => {
//     const token = localStorage.getItem("auth_token");
//     if (!token) return;

//     const res = await axios.get(`${API_BASE_URL}/locations/live`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     setAssets(res.data);
//   };

//   return (
//     <MapContainer
//       center={[11.66, 78.11]}
//       zoom={9}
//       style={{ height: "100vh", width: "100%" }}
//     >
//       <TileLayer
//         attribution="&copy; OpenStreetMap contributors"
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       {assets.map((asset) => (
//         <div key={asset.asset_id}>
//           {/* 🚚 LIVE TRUCK */}
//           <Marker
//             position={[
//               asset.location.latitude,
//               asset.location.longitude,
//             ]}
//             icon={truckIcon(
//               asset.heading || 0,
//               asset.inside_geofence
//             )}
//           >
//             <Popup>
//               <b>Asset:</b> {asset.asset_id}<br />
//               <b>Device:</b> {asset.device_id}<br />
//               <b>Status:</b>{" "}
//               {asset.inside_geofence ? "Inside" : "Outside"}<br />
//               <b>Distance:</b>{" "}
//               {asset.geofence.distance_meters.toFixed(1)} m<br />
//               <b>Heading:</b> {asset.heading ?? 0}°<br />
//               <b>Updated:</b> {asset.updated_at}
//             </Popup>
//           </Marker>

//           {/* 📍 BASE LOCATION */}
//           <Marker
//             position={[
//               asset.geofence.base_latitude,
//               asset.geofence.base_longitude,
//             ]}
//             icon={baseIcon}
//           />

//           {/* 🟦 GEOFENCE */}
//           <Circle
//             center={[
//               asset.geofence.base_latitude,
//               asset.geofence.base_longitude,
//             ]}
//             radius={asset.geofence.radius_meters}
//             pathOptions={{
//               color: asset.inside_geofence ? "green" : "red",
//               fillOpacity: 0.1,
//             }}
//           />
//         </div>
//       ))}
//     </MapContainer>
//   );
// }

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

/* ===============================
   API
================================ */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/* ===============================
   TYPES
================================ */
interface LiveAsset {
  asset_id: string;
  device_id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  inside_geofence: boolean;
  geofence: {
    base_latitude: number;
    base_longitude: number;
    radius_meters: number;
    distance_meters: number;
  };
  heading?: number; // degrees (0–360)
  updated_at: string;
}

const formatIST = (utcString: string) => {
  const date = new Date(utcString + "Z"); // force UTC
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });
};

/* ===============================
   CAR ICON (ROTATABLE)
================================ */
const carIcon = (heading = 0) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        transform: rotate(${heading}deg);
        font-size: 28px;
        line-height: 28px;
      ">
        🚗
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

/* ===============================
   BASE LOCATION ICON
================================ */
const baseIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:22px">📍</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

/* ===============================
   COMPONENT
================================ */
export default function MapPage() {
  const [assets, setAssets] = useState<LiveAsset[]>([]);

  useEffect(() => {
    fetchLiveAssets();
    const interval = setInterval(fetchLiveAssets, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchLiveAssets = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const res = await axios.get(`${API_BASE_URL}/locations/live`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setAssets(res.data);
  };

  return (
    <MapContainer
      center={[11.66, 78.11]}
      zoom={10}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {assets.map((asset) => (
        <div key={asset.asset_id}>
          {/* 🚗 LIVE ASSET */}
          <Marker
            position={[
              asset.location.latitude,
              asset.location.longitude,
            ]}
            icon={carIcon(asset.heading || 0)}
          >
            <Popup>
              <b>Asset:</b> {asset.asset_id}<br />
              <b>Device:</b> {asset.device_id}<br />
              <b>Status:</b>{" "}
              {asset.inside_geofence ? "Inside" : "Outside"}<br />
              <b>Distance:</b>{" "}
              {asset.geofence.distance_meters.toFixed(1)} m<br />
              <b>Updated:</b> {formatIST(asset.updated_at)}
            </Popup>
          </Marker>

          {/* 📍 BASE LOCATION */}
          <Marker
  position={[
    asset.geofence.base_latitude,
    asset.geofence.base_longitude,
  ]}
  icon={baseIcon}
>
  <Popup>
    <b>Base Location</b><br />
    <b>Asset ID:</b> {asset.asset_id}
  </Popup>
</Marker>


          {/* 🟦 GEOFENCE */}
          <Circle
            center={[
              asset.geofence.base_latitude,
              asset.geofence.base_longitude,
            ]}
            radius={asset.geofence.radius_meters}
            pathOptions={{
              color: asset.inside_geofence ? "green" : "red",
              fillOpacity: 0.1,
            }}
          />
        </div>
      ))}
    </MapContainer>
  );
}


// import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
// import L from "leaflet";
// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import "leaflet/dist/leaflet.css";

// /* ===============================
//    API
// ================================ */
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// /* ===============================
//    TYPES
// ================================ */
// interface LiveAsset {
//   asset_id: string;
//   device_id: string;
//   location: {
//     latitude: number;
//     longitude: number;
//   };
//   inside_geofence: boolean;
//   geofence: {
//     base_latitude: number;
//     base_longitude: number;
//     radius_meters: number;
//     distance_meters: number;
//   };
//   updated_at: string;
// }

// /* ===============================
//    ICONS
// ================================ */
// const carIcon = new L.Icon({
//   iconUrl: "https://img.icons8.com/color/96/truck.png",
//   iconSize: [36, 36],
//   iconAnchor: [18, 18],
// });

// /* ===============================
//    AUTO FIT MAP
// ================================ */
// function FitBounds({ assets }: { assets: LiveAsset[] }) {
//   const map = useMap();

//   useEffect(() => {
//     if (assets.length === 0) return;

//     const bounds = L.latLngBounds(
//       assets.map((a) => [
//         a.location.latitude,
//         a.location.longitude,
//       ])
//     );

//     map.fitBounds(bounds, { padding: [50, 50] });
//   }, [assets, map]);

//   return null;
// }

// /* ===============================
//    COMPONENT
// ================================ */
// export default function MapPage() {
//   const [assets, setAssets] = useState<LiveAsset[]>([]);
//   const trails = useRef<Record<string, [number, number][]>>({});

//   /* 🔄 Auto refresh every 5s */
//   useEffect(() => {
//     fetchLiveAssets();
//     const interval = setInterval(fetchLiveAssets, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   /* 📡 Fetch Live Assets */
//   const fetchLiveAssets = async () => {
//     const token = localStorage.getItem("auth_token");
//     if (!token) return;

//     const res = await axios.get(`${API_BASE_URL}/locations/live`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     setAssets((prev) => {
//       res.data.forEach((a: LiveAsset) => {
//         const key = a.asset_id;
//         const point: [number, number] = [
//           a.location.latitude,
//           a.location.longitude,
//         ];

//         if (!trails.current[key]) trails.current[key] = [];
//         trails.current[key].push(point);

//         if (trails.current[key].length > 20) {
//           trails.current[key].shift(); // limit trail length
//         }
//       });

//       return res.data;
//     });
//   };

//   return (
//     <MapContainer
//       center={[11.66, 78.11]}
//       zoom={6}
//       style={{ height: "100vh", width: "100%" }}
//     >
//       <TileLayer
//         attribution="&copy; OpenStreetMap contributors"
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       <FitBounds assets={assets} />

//       {assets.map((asset) => {
//         const trail = trails.current[asset.asset_id] || [];

//         return (
//           <div key={asset.asset_id}>
//             {/* 🚗 CAR MARKER */}
//             <Marker
//               position={[
//                 asset.location.latitude,
//                 asset.location.longitude,
//               ]}
//               icon={carIcon}
//             >
//               <Popup>
//                 <b>Asset:</b> {asset.asset_id} <br />
//                 <b>Device:</b> {asset.device_id} <br />
//                 <b>Status:</b>{" "}
//                 {asset.inside_geofence ? "Inside Geofence" : "Outside"} <br />
//                 <b>Latitude:</b> {asset.location.latitude} <br />
//                 <b>Longitude:</b> {asset.location.longitude} <br />
//                 <b>Distance:</b>{" "}
//                 {asset.geofence.distance_meters.toFixed(2)} m <br />
//                 <b>Updated:</b> {asset.updated_at}
//               </Popup>
//             </Marker>

//             {/* 🟦 GEOFENCE CIRCLE (BASE LOCATION) */}
//             <Circle
//               center={[
//                 asset.geofence.base_latitude,
//                 asset.geofence.base_longitude,
//               ]}
//               radius={asset.geofence.radius_meters}
//               pathOptions={{
//                 color: asset.inside_geofence ? "green" : "red",
//                 fillOpacity: 0.2,
//               }}
//             />

//             {/* 🛣 GPS TRAIL */}
//             {trail.length > 1 && (
//               <Polyline positions={trail} pathOptions={{ color: "blue" }} />
//             )}
//           </div>
//         );
//       })}
//     </MapContainer>
//   );
// }

// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Circle,
//   Polyline,
//   useMap,
//   useMapEvents,
// } from "react-leaflet";
// import L from "leaflet";
// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import "leaflet/dist/leaflet.css";

// /* ===============================
//    API
// ================================ */
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// /* ===============================
//    TYPES
// ================================ */
// interface LiveAsset {
//   asset_id: string;
//   device_id: string;
//   location: {
//     latitude: number;
//     longitude: number;
//   };
//   inside_geofence: boolean;
//   geofence: {
//     base_latitude: number;
//     base_longitude: number;
//     radius_meters: number;
//     distance_meters: number;
//   };
//   updated_at: string;
// }

// /* ===============================
//    CAR ICON 🚗
// ================================ */
// // const carIcon = new L.Icon({
// //   iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743988.png", // car PNG
// //   iconSize: [40, 40],       // adjust size as needed
// //   iconAnchor: [20, 20],     // point of the icon that corresponds to marker location
// // });
//   const carEmojiIcon = L.divIcon({
//   html: "🚗",
//   className: "",   // remove default styles
//   iconSize: [30, 30],
//   iconAnchor: [15, 15],
// });


// /* ===============================
//    FIT BOUNDS
// ================================ */
// function FitBounds({ assets }: { assets: LiveAsset[] }) {
//   const map = useMap();

//   useEffect(() => {
//     if (assets.length === 0) return;

//     const bounds = L.latLngBounds(
//       assets.map((a) => [
//         a.location.latitude,
//         a.location.longitude,
//       ])
//     );

//     map.fitBounds(bounds, { padding: [50, 50] });
//   }, [assets, map]);

//   return null;
// }

// /* ===============================
//    MOUSE LAT / LON DISPLAY
// ================================ */
// function MouseLatLng({
//   setLatLng,
// }: {
//   setLatLng: (v: string) => void;
// }) {
//   useMapEvents({
//     mousemove(e) {
//       setLatLng(
//         `Lat: ${e.latlng.lat.toFixed(6)}, Lng: ${e.latlng.lng.toFixed(6)}`
//       );
//     },
//   });
//   return null;
// }

// /* ===============================
//    MAIN COMPONENT
// ================================ */
// export default function MapPage() {
//   const [assets, setAssets] = useState<LiveAsset[]>([]);
//   const [latLngText, setLatLngText] = useState("");
//   const trailsRef = useRef<Record<string, [number, number][]>>({});

//   /* -----------------------------
//      FETCH LIVE ASSETS (5s)
//   ------------------------------ */
//   const fetchLiveAssets = async () => {
//     const token = localStorage.getItem("auth_token");
//     if (!token) return;

//     const res = await axios.get(`${API_BASE_URL}/locations/live`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     setAssets(res.data);

//     // Store trail history
//     res.data.forEach((asset: LiveAsset) => {
//       const key = asset.asset_id;
//       if (!trailsRef.current[key]) {
//         trailsRef.current[key] = [];
//       }
//       trailsRef.current[key].push([
//         asset.location.latitude,
//         asset.location.longitude,
//       ]);

//       // limit trail points
//       if (trailsRef.current[key].length > 30) {
//         trailsRef.current[key].shift();
//       }
//     });
//   };

//   useEffect(() => {
//     fetchLiveAssets();
//     const interval = setInterval(fetchLiveAssets, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <MapContainer
//       center={[11.66, 78.11]}
//       zoom={6}
//       style={{ height: "100vh", width: "100%" }}
//     >
//       <TileLayer
//         attribution="&copy; OpenStreetMap contributors"
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       <FitBounds assets={assets} />
//       <MouseLatLng setLatLng={setLatLngText} />

//       {assets.map((asset) => (
//         <div key={asset.asset_id}>
//           {/* 🚗 ASSET */}
//           <Marker
//             position={[
//               asset.location.latitude,
//               asset.location.longitude,
//             ]}
//             icon={carEmojiIcon}
//           >
//             <Popup>
//               <b>{asset.asset_id}</b>
//               <br />
//               Device: {asset.device_id}
//               <br />
//               Status:{" "}
//               {asset.inside_geofence ? "🟢 Inside" : "🔴 Outside"}
//               <br />
//               Distance: {asset.geofence.distance_meters?.toFixed(2)} m
//               <br />
//               Lat: {asset.location.latitude}
//               <br />
//               Lng: {asset.location.longitude}
//             </Popup>
//           </Marker>

//           {/* 🛣 GPS TRAIL */}
//           {trailsRef.current[asset.asset_id] && (
//             <Polyline
//               positions={trailsRef.current[asset.asset_id]}
//               pathOptions={{ color: "blue" }}
//             />
//           )}

//           {/* 🎯 GEOFENCE */}
//           {asset.geofence.base_latitude && (
//             <Circle
//               center={[
//                 asset.geofence.base_latitude,
//                 asset.geofence.base_longitude,
//               ]}
//               radius={asset.geofence.radius_meters}
//               pathOptions={{
//                 color: asset.inside_geofence ? "green" : "red",
//                 fillOpacity: 0.2,
//               }}
//             />
//           )}
//         </div>
//       ))}

//       {/* 📍 LAT/LON OVERLAY */}
//       <div
//         style={{
//           position: "absolute",
//           bottom: 10,
//           left: 10,
//           background: "white",
//           padding: "6px 10px",
//           borderRadius: 6,
//           fontSize: 12,
//         }}
//       >
//         {latLngText}
//       </div>
//     </MapContainer>
//   );
// }

// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Circle,
//   Polyline,
//   useMap,
//   useMapEvents,
// } from "react-leaflet";
// import L from "leaflet";
// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import "leaflet/dist/leaflet.css";

// /* ===============================
//    API
// ================================ */
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// /* ===============================
//    TYPES
// ================================ */
// interface LiveAsset {
//   asset_id: string;
//   device_id: string;
//   location: {
//     latitude: number;
//     longitude: number;
//   };
//   inside_geofence: boolean;
//   geofence: {
//     base_latitude: number;
//     base_longitude: number;
//     radius_meters: number;
//     distance_meters: number;
//   };
//   updated_at: string;
// }

// /* ===============================
//    ICONS
// ================================ */
// const assetIcon = new L.Icon({
//   iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
//   iconSize: [32, 32],
// });

// const baseIcon = new L.Icon({
//   iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
//   iconSize: [32, 32],
// });

// /* ===============================
//    AUTO FIT BOUNDS
// ================================ */
// function FitBounds({ assets }: { assets: LiveAsset[] }) {
//   const map = useMap();

//   useEffect(() => {
//     if (assets.length === 0) return;

//     const bounds = assets.map((a) => [
//       a.location.latitude,
//       a.location.longitude,
//     ]) as [number, number][];

//     map.fitBounds(bounds, { padding: [50, 50] });
//   }, [assets, map]);

//   return null;
// }

// /* ===============================
//    MOUSE LAT/LON DISPLAY
// ================================ */
// function MouseLatLng({
//   setCoords,
// }: {
//   setCoords: (c: string) => void;
// }) {
//   useMapEvents({
//     mousemove(e) {
//       setCoords(
//         `Lat: ${e.latlng.lat.toFixed(6)} , Lng: ${e.latlng.lng.toFixed(6)}`
//       );
//     },
//   });
//   return null;
// }

// /* ===============================
//    COMPONENT
// ================================ */
// export default function MapPage() {
//   const [assets, setAssets] = useState<LiveAsset[]>([]);
//   const [paths, setPaths] = useState<Record<string, [number, number][]>>({});
//   const [mouseCoords, setMouseCoords] = useState("");

//   /* -------------------------------
//      AUTO REFRESH (5s)
//   -------------------------------- */
//   useEffect(() => {
//     fetchLiveAssets();
//     const interval = setInterval(fetchLiveAssets, 5000);
//     return () => clearInterval(interval);
//   }, []);

//   const fetchLiveAssets = async () => {
//     const token = localStorage.getItem("auth_token");
//     if (!token) return;

//     const res = await axios.get(`${API_BASE_URL}/locations/live`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     const data: LiveAsset[] = res.data;
//     setAssets(data);

//     // update GPS trails
//     setPaths((prev) => {
//       const updated = { ...prev };
//       data.forEach((a) => {
//         const point: [number, number] = [
//           a.location.latitude,
//           a.location.longitude,
//         ];
//         updated[a.asset_id] = [...(updated[a.asset_id] || []), point].slice(-50);
//       });
//       return updated;
//     });
//   };

//   return (
//     <div style={{ position: "relative" }}>
//       {/* 🧭 LAT/LON DISPLAY */}
//       <div
//         style={{
//           position: "absolute",
//           bottom: 10,
//           left: 10,
//           zIndex: 1000,
//           background: "#fff",
//           padding: "6px 10px",
//           borderRadius: 6,
//           fontSize: 13,
//           boxShadow: "0 2px 6px rgba(0,0,0,.2)",
//         }}
//       >
//         {mouseCoords}
//       </div>

//       <MapContainer
//         center={[11.66, 78.11]}
//         zoom={6}
//         style={{ height: "100vh", width: "100%" }}
//       >
//         <TileLayer
//           attribution="&copy; OpenStreetMap contributors"
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />

//         <FitBounds assets={assets} />
//         <MouseLatLng setCoords={setMouseCoords} />

//         {assets.map((asset) => (
//           <div key={asset.asset_id}>
//             {/* 🚩 BASE LOCATION */}
//             <Marker
//               position={[
//                 asset.geofence.base_latitude,
//                 asset.geofence.base_longitude,
//               ]}
//               icon={baseIcon}
//             />

//             {/* 🟦 GEOFENCE */}
//             <Circle
//               center={[
//                 asset.geofence.base_latitude,
//                 asset.geofence.base_longitude,
//               ]}
//               radius={asset.geofence.radius_meters}
//               pathOptions={{
//                 color: asset.inside_geofence ? "green" : "red",
//                 fillOpacity: 0.2,
//               }}
//             />

//             {/* 🛣 GPS TRAIL */}
//             {paths[asset.asset_id] && (
//               <Polyline
//                 positions={paths[asset.asset_id]}
//                 pathOptions={{ color: "blue" }}
//               />
//             )}

//             {/* 🚗 LIVE ASSET */}
//             <Marker
//               position={[
//                 asset.location.latitude,
//                 asset.location.longitude,
//               ]}
//               icon={assetIcon}
//             >
//               <Popup>
//                 <b>{asset.asset_id}</b><br />
//                 Device: {asset.device_id}<br />
//                 Inside Geofence:{" "}
//                 {asset.inside_geofence ? "Yes" : "No"}<br />
//                 Distance:{" "}
//                 {asset.geofence.distance_meters.toFixed(2)} m<br />
//                 Lat: {asset.location.latitude}<br />
//                 Lng: {asset.location.longitude}<br />
//                 Updated: {asset.updated_at}
//               </Popup>
//             </Marker>
//           </div>
//         ))}
//       </MapContainer>
//     </div>
//   );
// }


// import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
// import L from "leaflet";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import "leaflet/dist/leaflet.css";

// /* ===============================
//    API
// ================================ */
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// /* ===============================
//    TYPES
// ================================ */
// interface LiveAsset {
//   asset_id: string;
//   device_id: string;
//   location: {
//     latitude: number;
//     longitude: number;
//   };
//   inside_geofence: boolean;
//   geofence: {
//     base_latitude: number;
//     base_longitude: number;
//     radius_meters: number;
//     distance_meters: number;
//   };
//   updated_at: string;
// }


// /* ===============================
//    ICONS
// ================================ */
// const redIcon = new L.Icon({
//   iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
//   iconSize: [32, 32],
// });

// const greenIcon = new L.Icon({
//   iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
//   iconSize: [32, 32],
// });

// /* ===============================
//    COMPONENT
// ================================ */
// export default function MapPage() {
//   const [assets, setAssets] = useState<LiveAsset[]>([]);

//   useEffect(() => {
//     fetchLiveAssets();
//   }, []);

//   const fetchLiveAssets = async () => {
//   const token = localStorage.getItem("auth_token");
//   if (!token) return;

//   const res = await axios.get(`${API_BASE_URL}/locations/live`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   setAssets(res.data);
// };


//   return (
//     <MapContainer
//       center={[11.66, 78.11]}
//       zoom={13}
//       style={{ height: "100vh", width: "100%" }}
//     >
//       <TileLayer
//         attribution="&copy; OpenStreetMap contributors"
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       {assets.map((asset) => (
//         <div key={asset.asset_id}>
//           {/* 🚗 Asset Marker */}
//           <Marker
//             position={[
//               asset.location.latitude,
//               asset.location.longitude,
//             ]}
//             icon={asset.inside_geofence ? greenIcon : redIcon}
//           >
//             <Popup>
//               <b>Asset:</b> {asset.asset_id} <br />
//               <b>Device:</b> {asset.device_id} <br />
//               <b>Status:</b>{" "}
//               {asset.inside_geofence ? "Inside" : "Outside"} <br />
//               <b>Distance:</b>{" "}
//               {asset.geofence.distance_meters.toFixed(2)} m
//             </Popup>
//           </Marker>

//           {/* 🟦 Geofence */}
//           <Circle
//             center={[
//               asset.geofence.base_latitude,
//               asset.geofence.base_longitude,
//             ]}
//             radius={asset.geofence.radius_meters}
//             pathOptions={{
//               color: asset.inside_geofence ? "green" : "red",
//             }}
//           />
//         </div>
//       ))}
//     </MapContainer>
//   );
// }


