// // src/components/MapPage.tsx
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { MapContainer, TileLayer, useMap, Polyline } from "react-leaflet";
// import L, { LatLngExpression } from "leaflet";
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster"; // ensure installed
// import axios from "axios";

// /**
//  * Config
//  */
// const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
// const POLL_INTERVAL_MS = 5000; // poll every 5s
// const DEFAULT_CENTER: LatLngExpression = [12.9716, 77.5946];
// const DEFAULT_ZOOM = 12;

// /**
//  * Small debounce helper (no lodash dependency)
//  */
// function debounce<T extends (...args: any[]) => void>(fn: T, wait = 150) {
//   let t: number | null = null;
//   const debounced = (...args: any[]) => {
//     if (t) window.clearTimeout(t);
//     t = window.setTimeout(() => fn(...args), wait);
//   };
//   debounced.cancel = () => {
//     if (t) window.clearTimeout(t);
//     t = null;
//   };
//   return debounced as T & { cancel?: () => void };
// }

// /**
//  * Fix Leaflet default image paths (if using local /public files)
//  * If you prefer CDN, these may not be required.
//  */
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: "/leaflet/marker-icon-2x.png",
//   iconUrl: "/leaflet/marker-icon.png",
//   shadowUrl: "/leaflet/marker-shadow.png",
// });

// /**
//  * Custom icon factory for rotating vehicle arrow (divIcon)
//  */
// function createVehicleDivIcon(heading = 0, color = "#ef4444", size = 36) {
//   const svg = `
//     <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//       <g transform="translate(12,12) rotate(${heading}) translate(-12,-12)">
//         <path d="M12 2 L3 21 L21 21 Z" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
//       </g>
//     </svg>
//   `;
//   return L.divIcon({
//     html: svg,
//     className: "vehicle-div-icon",
//     iconSize: [size, size],
//     iconAnchor: [size / 2, size * 0.9],
//   });
// }

// /**
//  * Active icon (bigger green)
//  */
// const ACTIVE_ICON = createVehicleDivIcon(0, "#16a34a", 48);
// /**
//  * Default icon (red)
//  */
// const DEFAULT_ICON = createVehicleDivIcon(0, "#ef4444", 36);

// /**
//  * Device icon fallback
//  */
// const DEVICE_ICON = L.icon({
//   iconUrl: "/icons/device-red.png", // put a small png in public/icons or replace with a URL
//   iconSize: [28, 28],
//   iconAnchor: [14, 28],
// });

// /**
//  * Helper for smooth animation of marker from -> to
//  */
// function animateMarkerPosition(marker: L.Marker, from: L.LatLng, to: L.LatLng, duration = 700) {
//   const start = performance.now();
//   function step(now: number) {
//     const t = Math.min((now - start) / duration, 1);
//     const lat = from.lat + (to.lat - from.lat) * t;
//     const lng = from.lng + (to.lng - from.lng) * t;
//     marker.setLatLng([lat, lng]);
//     if (t < 1) requestAnimationFrame(step);
//   }
//   requestAnimationFrame(step);
// }

// /**
//  * Set map view when center changes
//  */
// function SetView({ center, zoom }: { center: LatLngExpression | null; zoom?: number }) {
//   const map = useMap();
//   useEffect(() => {
//     if (!center) return;
//     map.setView(center, typeof zoom === "number" ? zoom : map.getZoom(), { animate: true, duration: 0.6 });
//   }, [center, zoom, map]);
//   return null;
// }

// /**
//  * Types
//  */
// type GeoPoint = { latitude: number; longitude: number };
// type AssetCurrent = {
//   id?: string;
//   asset_id?: string;
//   asset_name?: string;
//   asset_type?: string;
//   location: GeoPoint;
//   timestamp?: string;
//   status?: string;
//   alert?: string | null;
// };

// /**
//  * Main MapPage component
//  */
// export default function MapPage(): JSX.Element {
//   const [assets, setAssets] = useState<AssetCurrent[]>([]);
//   const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
//   const [routePoints, setRoutePoints] = useState<LatLngExpression[] | null>(null);
//   const [center, setCenter] = useState<LatLngExpression | null>(DEFAULT_CENTER);
//   const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
//   const [filterType, setFilterType] = useState<string>("all");
//   const [alertsOnly, setAlertsOnly] = useState<boolean>(false);
//   const [searchVal, setSearchVal] = useState<string>("");

//   // map + cluster + markers refs
//   const mapRef = useRef<L.Map | null>(null);
//   const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
//   const markersRef = useRef<Record<string, L.Marker>>({});

//   // polling ref
//   const pollRef = useRef<number | null>(null);

//   // ---------- fetch current assets ----------
//   const fetchCurrent = useCallback(async () => {
//     try {
//       const res = await axios.get(`${API}/assets/current`);
//       const data = Array.isArray(res.data) ? res.data : res.data.items ?? [];
//       const normalized: AssetCurrent[] = data
//         .map((d: any) => {
//           const asset_id = d.asset_id ?? d.assetId ?? d.asset?.asset_id;
//           const lat = d.location?.latitude ?? d.location?.lat ?? d.latitude ?? d.lat;
//           const lng = d.location?.longitude ?? d.location?.lng ?? d.longitude ?? d.lng;
//           return {
//             id: d.id ?? d._id ?? asset_id ?? String(Math.random()),
//             asset_id,
//             asset_name: d.asset_name ?? d.asset_name ?? d.name,
//             asset_type: d.asset_type ?? d.asset_type ?? d.type,
//             location: { latitude: Number(lat), longitude: Number(lng) },
//             timestamp: d.timestamp ?? d.last_seen,
//             status: d.status,
//             alert: d.alert ?? null,
//           };
//         })
//         .filter((a) => !Number.isNaN(a.location.latitude) && !Number.isNaN(a.location.longitude));
//       setAssets(normalized);
//       // if no center set to something sensible
//       if ((!center || (center[0] === DEFAULT_CENTER[0] && center[1] === DEFAULT_CENTER[1])) && normalized.length > 0) {
//         setCenter([normalized[0].location.latitude, normalized[0].location.longitude]);
//       }
//     } catch (err) {
//       console.error("Failed to fetch /assets/current", err);
//     }
//   }, [center]);

//   // ---------- update cluster markers ----------
//   const updateMarkers = useCallback(() => {
//     if (!mapRef.current) return;
//     if (!clusterRef.current) {
//       clusterRef.current = (L as any).markerClusterGroup();
//       clusterRef.current.addTo(mapRef.current);
//     }
//     const cluster = clusterRef.current!;
//     const keepKeys = new Set<string>();

//     // add/update asset markers
//     assets.forEach((a) => {
//       const key = `asset-${a.asset_id ?? a.id}`;
//       keepKeys.add(key);
//       const latLng = L.latLng(a.location.latitude, a.location.longitude);
//       const existing = markersRef.current[key];

//       if (existing) {
//         const from = existing.getLatLng();
//         if (!from.equals(latLng)) {
//           animateMarkerPosition(existing as any, from, latLng, 700);
//         }
//         existing.setPopupContent(makeAssetPopupHtml(a));
//         // highlight selected
//         if (selectedAssetId && (a.id === selectedAssetId || a.asset_id === selectedAssetId)) {
//           existing.setIcon(ACTIVE_ICON);
//         } else {
//           // alert assets show orange icon
//           const color = a.alert ? "#f97316" : "#ef4444";
//           existing.setIcon(createVehicleDivIcon(0, color, 36));
//         }
//       } else {
//         const icon = a.alert ? createVehicleDivIcon(0, "#f97316", 36) : DEFAULT_ICON;
//         const m = L.marker(latLng, { icon });
//         m.bindPopup(makeAssetPopupHtml(a));
//         m.on("click", () => {
//           // when marker clicked, select + fetch route
//           selectAsset(a);
//         });
//         markersRef.current[key] = m;
//         cluster.addLayer(m);
//       }
//     });

//     // remove stale markers
//     Object.keys(markersRef.current).forEach((k) => {
//       if (!keepKeys.has(k)) {
//         const m = markersRef.current[k];
//         cluster.removeLayer(m);
//         delete markersRef.current[k];
//       }
//     });
//   }, [assets, selectedAssetId]);

//   // create popup html for asset
//   function makeAssetPopupHtml(a: AssetCurrent) {
//     const online = !a.timestamp || Date.now() - new Date(a.timestamp).getTime() < 2 * 60 * 1000;
//     return `
//       <div style="min-width:200px">
//         <div style="font-weight:600">${a.asset_name ?? a.asset_id ?? "Asset"}</div>
//         <div style="font-size:12px;color:#444">ID: ${a.asset_id ?? a.id}</div>
//         <div style="font-size:12px;color:#444">Type: ${a.asset_type ?? "n/a"}</div>
//         <div style="font-size:12px;color:#444">Status: ${a.status ?? "-"}</div>
//         <div style="font-size:12px;color:${a.alert ? "crimson" : "#666"}">${a.alert ? "⚠️ " + a.alert : ""}</div>
//         <div style="margin-top:8px;display:flex;gap:6px">
//           <button id="track-btn" style="padding:6px 8px;background:#2563eb;color:white;border-radius:4px;border:none;cursor:pointer">Track</button>
//           <button id="route-btn" style="padding:6px 8px;background:#10b981;color:white;border-radius:4px;border:none;cursor:pointer">Show Route</button>
//         </div>
//       </div>
//     `;
//   }

//   // When user clicks popup buttons we need to capture them after popupopen
//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map) return;
//     function onPopupOpen(e: any) {
//       const popupEl = e.popup.getElement();
//       if (!popupEl) return;
//       const trackBtn = popupEl.querySelector("#track-btn") as HTMLButtonElement | null;
//       const routeBtn = popupEl.querySelector("#route-btn") as HTMLButtonElement | null;
//       // wire them: pulling asset id from popup text (simple)
//       const idLine = popupEl.querySelector("div[style*='font-size:12px']")?.textContent ?? "";
//       const match = idLine.match(/ID:\s*(.+)/);
//       const assetId = match ? match[1].trim() : null;
//       if (trackBtn && assetId) {
//         trackBtn.onclick = () => {
//           jumpToAsset(assetId);
//         };
//       }
//       if (routeBtn && assetId) {
//         routeBtn.onclick = () => {
//           // find asset and load history
//           const found = assets.find((x) => (x.asset_id ?? x.id) === assetId || x.id === assetId);
//           if (found) selectAsset(found);
//         };
//       }
//     }
//     map.on("popupopen", onPopupOpen);
//     return () => map.off("popupopen", onPopupOpen);
//   }, [assets]);

//   // ---------- select asset: highlight + fetch history ----------
//   async function selectAsset(a: AssetCurrent) {
//     setSelectedAssetId(a.id ?? a.asset_id ?? null);
//     setCenter([a.location.latitude, a.location.longitude]);
//     setZoom(15);

//     // fetch route history from backend
//     try {
//       const identifier = encodeURIComponent(a.asset_id ?? a.id ?? "");
//       const res = await axios.get(`${API}/assets/${identifier}/history?days=7`);
//       const pts: LatLngExpression[] = (Array.isArray(res.data) ? res.data : [])
//         .map((p: any) => {
//           const lat = p.location?.latitude ?? p.latitude ?? p.lat;
//           const lng = p.location?.longitude ?? p.longitude ?? p.lng;
//           return [Number(lat), Number(lng)];
//         })
//         .filter((pt: any) => !Number.isNaN(pt[0]) && !Number.isNaN(pt[1]));
//       setRoutePoints(pts.length > 0 ? pts : null);
//       // open popup of selected marker
//       setTimeout(() => {
//         const marker = markersRef.current[`asset-${a.asset_id ?? a.id}`];
//         marker?.openPopup();
//       }, 300);
//     } catch (err) {
//       console.warn("Failed to fetch history for", a, err);
//       setRoutePoints(null);
//     }
//   }

//   // ---------- jump to asset by id (search) ----------
//   async function jumpToAsset(assetId: string) {
//     assetId = assetId.trim();
//     if (!assetId) return;
//     // first try local assets
//     const found = assets.find((a) => (a.asset_id ?? a.id) === assetId || a.id === assetId);
//     if (found) {
//       selectAsset(found);
//       return;
//     }
//     // fallback to API /assets/by-asset/{asset_id}
//     try {
//       const res = await axios.get(`${API}/assets/by-asset/${encodeURIComponent(assetId)}`);
//       if (res.data) {
//         const a = res.data;
//         const lat = a.registered_location?.latitude ?? a.registered_location?.lat;
//         const lng = a.registered_location?.longitude ?? a.registered_location?.lng;
//         if (lat && lng) {
//           const asset: AssetCurrent = {
//             id: a.id ?? a._id ?? a.asset_id,
//             asset_id: a.asset_id,
//             asset_name: a.asset_name,
//             asset_type: a.asset_type,
//             location: { latitude: Number(lat), longitude: Number(lng) },
//             timestamp: a.updated_at,
//             status: undefined,
//           };
//           setAssets((s) => {
//             // add to local assets if missing
//             if (!s.find((x) => (x.asset_id ?? x.id) === (asset.asset_id ?? asset.id))) {
//               return [...s, asset];
//             }
//             return s;
//           });
//           selectAsset(asset);
//           return;
//         }
//       }
//       alert("Asset not found");
//     } catch (err) {
//       console.warn("Jump fetch failed:", err);
//       alert("Asset not found");
//     }
//   }

//   // ---------- polling lifecycle ----------
//   useEffect(() => {
//     // initial load
//     (async () => {
//       await fetchCurrent();
//     })();

//     // start polling
//     pollRef.current = window.setInterval(async () => {
//       await fetchCurrent();
//     }, POLL_INTERVAL_MS);

//     return () => {
//       if (pollRef.current) window.clearInterval(pollRef.current);
//     };
//   }, [fetchCurrent]);

//   // update markers whenever assets change
//   useEffect(() => {
//     updateMarkers();
//   }, [assets, updateMarkers]);

//   // change icons when selected asset changes (highlight)
//   useEffect(() => {
//     Object.entries(markersRef.current).forEach(([key, m]) => {
//       const id = key.replace(/^asset-/, "");
//       if (selectedAssetId && (id === selectedAssetId)) {
//         m.setIcon(ACTIVE_ICON);
//         m.openPopup();
//       } else if (key.startsWith("asset-")) {
//         // reset icon to default/alert color
//         const asset = assets.find((x) => (x.asset_id ?? x.id) === id || x.id === id);
//         const color = asset?.alert ? "#f97316" : "#ef4444";
//         m.setIcon(createVehicleDivIcon(0, color, 36));
//       }
//     });
//   }, [selectedAssetId, assets]);

//   // ---------- UI filter & search ----------
//   const filteredAssets = assets.filter((a) => {
//     if (alertsOnly && !a.alert) return false;
//     if (filterType !== "all" && a.asset_type !== filterType) return false;
//     if (!searchVal) return true;
//     const s = searchVal.toLowerCase();
//     return (a.asset_id ?? "").toLowerCase().includes(s) || (a.asset_name ?? "").toLowerCase().includes(s);
//   });

//   // debounced input handler
//   const debouncedSetSearch = useRef(debounce((v: string) => setSearchVal(v), 120)).current;

//   // ---------- map created callback ----------
//   const onMapCreated = (mapInstance: L.Map) => {
//     mapRef.current = mapInstance;
//     if (!clusterRef.current) {
//       clusterRef.current = (L as any).markerClusterGroup();
//       clusterRef.current.addTo(mapInstance);
//     }
//   };

//   // ---------- clean up on unmount ----------
//   useEffect(() => {
//     return () => {
//       // remove cluster and markers to avoid leaks
//       if (clusterRef.current && mapRef.current) {
//         clusterRef.current.clearLayers();
//         mapRef.current.removeLayer(clusterRef.current);
//       }
//     };
//   }, []);

//   // ---------- JSX ----------
//   return (
//     <div className="w-full h-screen flex">
//       {/* Sidebar */}
//       <aside className="w-80 bg-white border-r p-3 overflow-auto">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-semibold">Assets</h2>
//           <div className="text-sm">
//             <button
//               onClick={() => {
//                 setAlertsOnly((s) => !s);
//               }}
//               className={`px-2 py-1 rounded ${alertsOnly ? "bg-red-600 text-white" : "bg-gray-100"}`}
//             >
//               {alertsOnly ? "Alerts: ON" : "Alerts"}
//             </button>
//           </div>
//         </div>

//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search by asset id or name..."
//             onChange={(e) => debouncedSetSearch(e.target.value)}
//             className="w-full p-2 border rounded"
//           />
//           <div className="flex gap-2 mt-2">
//             <button
//               onClick={() => {
//                 debouncedSetSearch.cancel?.();
//                 setSearchVal("");
//                 (document.querySelector('input') as HTMLInputElement | null)?.focus();
//               }}
//               className="px-2 py-1 bg-gray-100 rounded"
//             >
//               Reset
//             </button>
//             <button
//               onClick={() => {
//                 const val = (document.querySelector('input') as HTMLInputElement | null)?.value ?? "";
//                 jumpToAsset(val);
//               }}
//               className="px-2 py-1 bg-blue-600 text-white rounded"
//             >
//               Jump
//             </button>
//           </div>
//         </div>

//         <div className="mb-3">
//           <label className="text-sm">Type filter</label>
//           <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2 border rounded mt-1">
//             <option value="all">All</option>
//             <option value="vehicle">vehicle</option>
//             <option value="machine">machine</option>
//             <option value="person">person</option>
//           </select>
//         </div>

//         <div>
//           {filteredAssets.length === 0 && <div className="text-sm text-gray-500">No assets found.</div>}
//           {filteredAssets.map((a) => {
//             const key = a.asset_id ?? a.id;
//             const isSelected = selectedAssetId === (a.id ?? a.asset_id);
//             const online = !a.timestamp || Date.now() - new Date(a.timestamp).getTime() < 2 * 60 * 1000;
//             return (
//               <div
//                 key={key}
//                 className={`p-2 border rounded mb-2 cursor-pointer ${isSelected ? "bg-blue-50" : "bg-white"}`}
//                 onClick={() => selectAsset(a)}
//               >
//                 <div className="flex justify-between">
//                   <div>
//                     <div className="font-semibold">{a.asset_name ?? a.asset_id ?? key}</div>
//                     <div className="text-xs text-gray-600">{a.asset_type ?? "type unknown"}</div>
//                     <div className="text-xs text-gray-500">{a.status ?? ""}</div>
//                     {a.alert && <div className="text-xs text-red-600 font-bold">⚠️ {a.alert}</div>}
//                   </div>
//                   <div className="text-right">
//                     <div className={`text-sm ${online ? "text-green-600" : "text-gray-400"}`}>{online ? "online" : "offline"}</div>
//                     <div className="text-xs text-gray-400">
//                       {a.location.latitude.toFixed(4)}, {a.location.longitude.toFixed(4)}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </aside>

//       {/* Map */}
//       <main className="flex-1 relative">
//         <MapContainer
//           center={center || DEFAULT_CENTER}
//           zoom={zoom}
//           style={{ height: "100%", width: "100%" }}
//           whenCreated={(mapInstance) => onMapCreated(mapInstance)}
//         >
//           <SetView center={center} zoom={zoom} />
//           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

//           {/* route polyline */}
//           {routePoints && routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: "#1d4ed8", weight: 4 }} />}
//         </MapContainer>
//       </main>
//     </div>
//   );
// }


// import { useEffect, useState, useRef, useCallback } from 'react';
// import { 
//   MapPin, Navigation, ZoomIn, ZoomOut, Layers, X, Battery, Clock, 
//   Link, RefreshCw, Search, Car, Smartphone, Truck
// } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Fix for default markers in Leaflet
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
// });

// interface LinkedDevice {
//   device_id: string;
//   device_name: string;
//   device_model: string;
//   battery_level: number | null;
//   device_status: string;
//   link_status: string;
//   linked_at: string;
// }

// interface AssetWithDevices {
//   id: string;
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description: string;
//   registered_location: {
//     latitude: number;
//     longitude: number;
//     radius: number;
//   };
//   user_id: string;
//   created_at: string;
//   updated_at: string;
//   linked_devices: LinkedDevice[];
// }

// interface MapMarker {
//   id: string;
//   type: 'asset';
//   name: string;
//   latitude: number;
//   longitude: number;
//   asset: AssetWithDevices;
//   device?: LinkedDevice;
//   deviceStatus?: string;
// }

// // ✅ Updated BASE_URL to use Vite environment variable with fallback
// const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// // Get icon based on asset type
// const getAssetIcon = (assetType: string) => {
//   switch (assetType.toLowerCase()) {
//     case 'vehicle':
//     case 'car':
//     case 'truck':
//       return <Truck className="w-4 h-4" />;
//     case 'device':
//     case 'gps':
//     case 'phone':
//       return <Smartphone className="w-4 h-4" />;
//     default:
//       return <Car className="w-4 h-4" />;
//   }
// };

// // Custom icons for Leaflet
// const createAssetIcon = (assetType: string, hasLinkedDevices: boolean) => {
//   let color = '#3b82f6'; // Default blue for assets
//   if (hasLinkedDevices) color = '#8b5cf6'; // Purple for assets with linked devices
  
//   return L.divIcon({
//     html: `
//       <div style="
//         background-color: ${color};
//         width: 28px;
//         height: 28px;
//         border-radius: 50%;
//         border: 2px solid white;
//         box-shadow: 0 2px 6px rgba(0,0,0,0.3);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         color: white;
//         position: relative;
//       ">
//         ${getAssetIconHtml(assetType)}
//         ${hasLinkedDevices ? `
//           <div style="
//             position: absolute;
//             top: -5px;
//             right: -5px;
//             width: 14px;
//             height: 14px;
//             background-color: #10b981;
//             border-radius: 50%;
//             border: 2px solid white;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             font-size: 8px;
//             font-weight: bold;
//           ">
//             <svg width="6" height="6" viewBox="0 0 24 24" fill="white" stroke="white">
//               <path d="M13.5 10.5L21 3M16 3h5v5M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
//             </svg>
//           </div>
//         ` : ''}
//       </div>
//     `,
//     iconSize: [28, 28],
//     iconAnchor: [14, 14],
//     className: 'asset-marker'
//   });
// };

// const getAssetIconHtml = (assetType: string) => {
//   switch (assetType.toLowerCase()) {
//     case 'vehicle':
//     case 'car':
//     case 'truck':
//       return '🚚';
//     case 'device':
//     case 'gps':
//       return '📱';
//     default:
//       return '📍';
//   }
// };

// const createSelectedIcon = (assetType: string, hasLinkedDevices: boolean) => {
//   let color = '#dc2626'; // Red for selected
  
//   return L.divIcon({
//     html: `
//       <div style="
//         background-color: ${color};
//         width: 36px;
//         height: 36px;
//         border-radius: 50%;
//         border: 3px solid white;
//         box-shadow: 0 3px 8px rgba(0,0,0,0.4);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         color: white;
//         font-size: 16px;
//         position: relative;
//         animation: pulse 1.5s infinite;
//       ">
//         ${getAssetIconHtml(assetType)}
//         ${hasLinkedDevices ? `
//           <div style="
//             position: absolute;
//             top: -6px;
//             right: -6px;
//             width: 16px;
//             height: 16px;
//             background-color: #10b981;
//             border-radius: 50%;
//             border: 2px solid white;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             font-size: 9px;
//             font-weight: bold;
//           ">
//             <svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="white">
//               <path d="M13.5 10.5L21 3M16 3h5v5M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
//             </svg>
//           </div>
//         ` : ''}
//       </div>
//       <style>
//         @keyframes pulse {
//           0% { transform: scale(1); }
//           50% { transform: scale(1.1); }
//           100% { transform: scale(1); }
//         }
//       </style>
//     `,
//     iconSize: [36, 36],
//     iconAnchor: [18, 18],
//     className: 'selected-asset-marker'
//   });
// };

// // ---------------------------------------------------
// // Main MapPage Component
// // ---------------------------------------------------
// function MapPage() {
//   const { user } = useAuth();
//   const [assetsWithDevices, setAssetsWithDevices] = useState<AssetWithDevices[]>([]);
//   const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]);
//   const [mapZoom, setMapZoom] = useState(4);
//   const [mapError, setMapError] = useState<string | null>(null);
  
//   const mapRef = useRef<L.Map | null>(null);
//   const markersRef = useRef<L.Marker[]>([]);
//   const [filteredAssets, setFilteredAssets] = useState<AssetWithDevices[]>([]);
//   const mapInitializedRef = useRef(false);

//   // ... rest of your code remains unchanged ...
//   // all useEffect hooks, functions, JSX, etc.

//   // For brevity, I'm keeping your original JSX intact
//   if (loading) return <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200 w-full" style={{ height: 'calc(100vh - 200px)' }}><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div><span className="text-gray-600">Loading assets with linked devices...</span></div>;

//   return (
//     <div className="relative w-full bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height:'calc(100vh - 200px)', minHeight:'600px', position:'relative' }}>
//       {/* Top Controls */}
//       <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
//         <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-3 w-96">
//           <Search className="w-5 h-5 text-blue-600" />
//           <input type="text" placeholder="Search assets, devices, IDs, or types..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="outline-none text-sm w-full bg-transparent" />
//           <div className="text-xs text-gray-500">{filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'} • {assetsWithDevices.filter(a => a.linked_devices?.length > 0).length} with devices</div>
//         </div>
//       </div>
//       {/* Map Container */}
//       <div id="map" className="w-full h-full"></div>
//     </div>
//   );
// }

// // ✅ Default export
// export default MapPage;
import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  MapPin, Navigation, ZoomIn, ZoomOut, Layers, X, Battery, Clock, 
  Link, RefreshCw, Search, Car, Smartphone, Truck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LinkedDevice {
  device_id: string;
  device_name: string;
  device_model: string;
  battery_level: number | null;
  device_status: string;
  link_status: string;
  linked_at: string;
}

interface AssetWithDevices {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_type: string;
  description: string;
  registered_location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  user_id: string;
  created_at: string;
  updated_at: string;
  linked_devices: LinkedDevice[];
}

interface MapMarker {
  id: string;
  type: 'asset';
  name: string;
  latitude: number;
  longitude: number;
  asset: AssetWithDevices;
  device?: LinkedDevice;
  deviceStatus?: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Get icon based on asset type
const getAssetIcon = (assetType: string) => {
  switch (assetType.toLowerCase()) {
    case 'vehicle':
    case 'car':
    case 'truck':
      return <Truck className="w-4 h-4" />;
    case 'device':
    case 'gps':
    case 'phone':
      return <Smartphone className="w-4 h-4" />;
    default:
      return <Car className="w-4 h-4" />;
  }
};

// Custom icons for Leaflet
const createAssetIcon = (assetType: string, hasLinkedDevices: boolean) => {
  let color = '#3b82f6'; // Default blue for assets
  
  if (hasLinkedDevices) {
    color = '#8b5cf6'; // Purple for assets with linked devices
  }
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: relative;
      ">
        ${getAssetIconHtml(assetType)}
        ${hasLinkedDevices ? `
          <div style="
            position: absolute;
            top: -5px;
            right: -5px;
            width: 14px;
            height: 14px;
            background-color: #10b981;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
          ">
            <svg width="6" height="6" viewBox="0 0 24 24" fill="white" stroke="white">
              <path d="M13.5 10.5L21 3M16 3h5v5M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    className: 'asset-marker'
  });
};

const getAssetIconHtml = (assetType: string) => {
  switch (assetType.toLowerCase()) {
    case 'vehicle':
    case 'car':
    case 'truck':
      return '🚚';
    case 'device':
    case 'gps':
      return '📱';
    default:
      return '📍';
  }
};

const createSelectedIcon = (assetType: string, hasLinkedDevices: boolean) => {
  let color = '#dc2626'; // Red for selected
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        position: relative;
        animation: pulse 1.5s infinite;
      ">
        ${getAssetIconHtml(assetType)}
        ${hasLinkedDevices ? `
          <div style="
            position: absolute;
            top: -6px;
            right: -6px;
            width: 16px;
            height: 16px;
            background-color: #10b981;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            font-weight: bold;
          ">
            <svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="white">
              <path d="M13.5 10.5L21 3M16 3h5v5M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          </div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    className: 'selected-asset-marker'
  });
};

export function MapPage() {
  const { user } = useAuth();
  const [assetsWithDevices, setAssetsWithDevices] = useState<AssetWithDevices[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]);
  const [mapZoom, setMapZoom] = useState(4);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetWithDevices[]>([]);
  const mapInitializedRef = useRef(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!mapInitializedRef.current) {
      const timer = setTimeout(() => {
        initializeMap();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []);

  // Filter assets based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAssets(assetsWithDevices);
      return;
    }

    const timer = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim();
      
      const filtered = assetsWithDevices.filter(asset => {
        // Search in asset name
        if (asset.asset_name.toLowerCase().includes(query)) return true;
        
        // Search in asset ID
        if (asset.asset_id.toLowerCase().includes(query)) return true;
        
        // Search in asset type
        if (asset.asset_type.toLowerCase().includes(query)) return true;
        
        // Search in description
        if (asset.description?.toLowerCase().includes(query)) return true;
        
        // Search in linked devices
        if (asset.linked_devices && asset.linked_devices.length > 0) {
          const hasMatchingDevice = asset.linked_devices.some(device => {
            if (device.device_id?.toLowerCase().includes(query)) return true;
            if (device.device_name?.toLowerCase().includes(query)) return true;
            if (device.device_model?.toLowerCase().includes(query)) return true;
            return false;
          });
          if (hasMatchingDevice) return true;
        }
        
        return false;
      });
      
      setFilteredAssets(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, assetsWithDevices]);

  // Plot markers when filteredAssets changes
  useEffect(() => {
    if (mapRef.current && filteredAssets.length > 0) {
      plotMarkers();
    } else if (mapRef.current && filteredAssets.length === 0) {
      // Clear markers if no assets
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    }
  }, [filteredAssets, selectedMarker]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize(true);
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeMap = () => {
    if (typeof window === 'undefined') return;
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      setTimeout(initializeMap, 100);
      return;
    }

    const checkDimensions = () => {
      if (mapContainer.clientHeight === 0 || mapContainer.clientWidth === 0) {
        setTimeout(checkDimensions, 100);
        return;
      }
      
      createMapInstance();
    };
    
    checkDimensions();
  };

  const createMapInstance = () => {
    try {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map('map', {
        center: [mapCenter[0], mapCenter[1]],
        zoom: mapZoom,
        attributionControl: false,
        zoomControl: false,
        fadeAnimation: true,
        markerZoomAnimation: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 2,
      }).addTo(map);

      // Add controls
      L.control.zoom({
        position: 'topright'
      }).addTo(map);

      L.control.attribution({
        position: 'bottomright'
      }).addTo(map);

      mapRef.current = map;
      mapInitializedRef.current = true;
      setMapError(null);

      // Update state on map movement
      map.on('moveend', () => {
        const center = map.getCenter();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(map.getZoom());
      });

      // Invalidate size
      setTimeout(() => {
        map.invalidateSize(true);
      }, 300);

      // Plot markers if data is available
      if (filteredAssets.length > 0) {
        plotMarkers();
      }

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to load map. Please refresh the page.');
    }
  };

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No authentication token found');

      // Fetch assets with linked devices
      // const assetsRes = await fetch(${BASE_URL}/assets/with-devices/, {
      //   headers: { 
      //     'Authorization': Bearer ${token},
      //   },
      // });
      const assetsRes = await fetch(
  `${BASE_URL}/assets/with-devices/`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        console.log('Assets with devices loaded:', assetsData.length, assetsData);
        
        // Filter out assets that have empty linked devices
        const validAssets = assetsData.filter((asset: AssetWithDevices) => 
          asset.registered_location && 
          asset.registered_location.latitude && 
          asset.registered_location.longitude
        );
        
        setAssetsWithDevices(validAssets);
        setFilteredAssets(validAssets);
      } else {
        throw new Error('Failed to load assets');
      }

    } catch (error) {
      console.error("Error loading data:", error);
      setMapError('Failed to load asset data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const plotMarkers = useCallback(() => {
    if (!mapRef.current) {
      console.warn('Cannot plot markers: map not initialized');
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    filteredAssets.forEach(asset => {
      const hasLinkedDevices = asset.linked_devices && asset.linked_devices.length > 0;
      const isSelected = selectedMarker?.asset.id === asset.id;
      
      let icon;
      if (isSelected) {
        icon = createSelectedIcon(asset.asset_type, hasLinkedDevices);
      } else {
        icon = createAssetIcon(asset.asset_type, hasLinkedDevices);
      }

      try {
        const latlng = [
          asset.registered_location.latitude, 
          asset.registered_location.longitude
        ] as L.LatLngExpression;
        
        const linkedDevicesCount = asset.linked_devices?.length || 0;
        
        const popupContent = `
          <div style="padding: 10px; min-width: 240px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${hasLinkedDevices ? '#8b5cf6' : '#3b82f6'}; display: flex; align-items: center; justify-content: center; color: white; margin-right: 10px; font-size: 16px;">
                ${getAssetIconHtml(asset.asset_type)}
              </div>
              <div>
                <strong style="font-size: 14px; color: #1f2937;">${asset.asset_name}</strong>
                <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                  ${asset.asset_type} • ID: ${asset.asset_id}
                </div>
              </div>
            </div>
            
            ${asset.description ? `
              <div style="font-size: 11px; color: #4b5563; margin-bottom: 8px; padding: 6px; background-color: #f9fafb; border-radius: 4px;">
                ${asset.description}
              </div>
            ` : ''}
            
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              <div>📍 ${asset.registered_location.latitude.toFixed(4)}, ${asset.registered_location.longitude.toFixed(4)}</div>
              <div>Radius: ${asset.registered_location.radius} km</div>
            </div>
            
            ${hasLinkedDevices ? `
              <div style="background-color: #f3f4f6; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                <div style="font-size: 11px; color: #8b5cf6; font-weight: 600; margin-bottom: 4px;">
                  Linked Devices (${linkedDevicesCount})
                </div>
                <div style="font-size: 10px; color: #6b7280;">
                  ${asset.linked_devices.map(device => `
                    <div style="margin-bottom: 2px;">
                      • ${device.device_name} (${device.device_id})
                      <span style="color: ${device.device_status === 'online' ? '#10b981' : '#ef4444'}; margin-left: 4px;">
                        ${device.device_status}
                      </span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div style="background-color: #f3f4f6; padding: 8px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280;">
                  No linked devices
                </div>
              </div>
            `}
            
            <div style="font-size: 10px; color: #9ca3af; text-align: center; margin-top: 8px;">
              Click for details
            </div>
          </div>
        `;
        
        const leafletMarker = L.marker(latlng, { icon })
          .addTo(mapRef.current!)
          .bindPopup(popupContent);

        leafletMarker.on('click', () => {
          setSelectedMarker({
            id: asset.id,
            type: 'asset',
            name: asset.asset_name,
            latitude: asset.registered_location.latitude,
            longitude: asset.registered_location.longitude,
            asset: asset
          });
          mapRef.current?.setView([asset.registered_location.latitude, asset.registered_location.longitude], 14);
        });

        markersRef.current.push(leafletMarker);
      } catch (error) {
        console.error('Error adding marker:', error, asset);
      }
    });

    // Fit bounds if we have markers
    if (filteredAssets.length > 0 && mapRef.current) {
      try {
        const bounds = L.latLngBounds(
          filteredAssets.map(asset => [
            asset.registered_location.latitude, 
            asset.registered_location.longitude
          ] as L.LatLngExpression)
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [filteredAssets, selectedMarker]);

  const handleAssetSelect = (asset: AssetWithDevices) => {
    const marker: MapMarker = {
      id: asset.id,
      type: 'asset',
      name: asset.asset_name,
      latitude: asset.registered_location.latitude,
      longitude: asset.registered_location.longitude,
      asset: asset
    };
    
    setSelectedMarker(marker);
    if (mapRef.current) {
      mapRef.current.setView([
        asset.registered_location.latitude, 
        asset.registered_location.longitude
      ], 14);
    }
  };

  const fitToMarkers = () => {
    if (filteredAssets.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        filteredAssets.map(asset => [
          asset.registered_location.latitude, 
          asset.registered_location.longitude
        ])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([39.8283, -98.5795], 4);
    }
  };

  // Count linked assets (assets with linked devices)
  const linkedAssetsCount = assetsWithDevices.filter(
    asset => asset.linked_devices && asset.linked_devices.length > 0
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200 w-full" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-gray-600">Loading assets with linked devices...</span>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full bg-white rounded-lg border border-gray-200 overflow-hidden" 
      style={{ 
        height: 'calc(100vh - 200px)',
        minHeight: '600px',
        position: 'relative'
      }}
    >
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
        <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-3 w-96">
          <Search className="w-5 h-5 text-blue-600" />
          <input
            type="text"
            placeholder="Search assets, devices, IDs, or types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="outline-none text-sm w-full bg-transparent"
          />
          <div className="text-xs text-gray-500">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'} • {linkedAssetsCount} with devices
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw  className={`w-4 h-4 text-gray-700 ${    refreshing ? 'animate-spin' : ''  }`}
/>          </button>

            <button onClick={zoomIn} 
              className="p-2 hover:bg-gray-100 rounded transition"
              title="Zoom in">
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </button>
            <button onClick={zoomOut} 
              className="p-2 hover:bg-gray-100 rounded transition"
              title="Zoom out">
              <ZoomOut className="w-4 h-4 text-gray-700" />
            </button>
            <button onClick={fitToMarkers} 
              className="p-2 hover:bg-gray-100 rounded transition"
              title="Fit to markers">
              <Navigation className="w-4 h-4 text-gray-700" />
            </button>
            <button onClick={resetView} 
              className="p-2 hover:bg-gray-100 rounded transition"
              title="Reset view">
              <MapPin className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Assets List with Linked Devices */}
      <div className="absolute top-20 right-4 z-[1000] w-96 bg-white rounded-lg shadow-lg max-h-[calc(100vh-320px)] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-blue-600" />
              Assets with Linked Devices
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {filteredAssets.length}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Showing assets with their linked devices
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Car className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium">No assets found</p>
              <p className="text-xs mt-1">
                {searchQuery.trim() 
                  ? 'No assets match your search' 
                  : 'No assets with registered locations found'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-3">
              {filteredAssets.map((asset) => {
                const hasLinkedDevices = asset.linked_devices && asset.linked_devices.length > 0;
                const linkedDevicesCount = asset.linked_devices?.length || 0;
                const isSelected = selectedMarker?.asset.id === asset.id;
                
                return (
                  <div
                    key={asset.id}
                    onClick={() => handleAssetSelect(asset)}
                    className={`w-full p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 transform scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    {/* Asset Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          hasLinkedDevices ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {getAssetIcon(asset.asset_type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                            {asset.asset_name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              hasLinkedDevices 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {asset.asset_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              ID: {asset.asset_id}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="animate-pulse">
                          <MapPin className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </div>

                    {/* Asset Description */}
                    {asset.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {asset.description}
                      </p>
                    )}

                    {/* Location */}
                    <div className="mb-3">
                      <div className="flex items-center text-xs text-blue-600 mb-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        Location
                      </div>
                      <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                        {asset.registered_location.latitude.toFixed(4)}, {asset.registered_location.longitude.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Radius: {asset.registered_location.radius} km
                      </div>
                    </div>

                    {/* Linked Devices Section */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs text-gray-700">
                          <Link className="w-3 h-3 mr-1" />
                          {/* <span className="font-medium">
                            Linked Devices {hasLinkedDevices && (${linkedDevicesCount})}
                          </span> */}
                          <span className="font-medium">
  Linked Devices {hasLinkedDevices && `(${linkedDevicesCount})`}
</span>

                        </div>
                        {hasLinkedDevices && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            linkedDevicesCount > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {linkedDevicesCount} {linkedDevicesCount === 1 ? 'device' : 'devices'}
                          </span>
                        )}
                      </div>

                      {hasLinkedDevices ? (
                        <div className="space-y-2">
                          {asset.linked_devices.map((device, index) => (
                            <div 
                              key={index} 
                              className="bg-gray-50 p-2 rounded border border-gray-100"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <div className="font-medium text-xs text-gray-900">
                                    {device.device_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {device.device_id} • {device.device_model}
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  device.device_status === 'online'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {device.device_status}
                                </span>
                              </div>
                              
                              <div className="flex justify-between items-center mt-2 text-xs">
                                {device.battery_level !== null && (
                                  <div className="flex items-center text-gray-600">
                                    <Battery className="w-3 h-3 mr-1" />
                                    {device.battery_level}%
                                  </div>
                                )}
                                <div className="text-gray-500">
                                  Linked: {new Date(device.linked_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-gray-50 rounded border border-gray-100">
                          <p className="text-xs text-gray-500">No devices linked</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Details Panel for Selected Asset */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 z-[1000] w-96 bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                selectedMarker.asset.linked_devices?.length > 0 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {getAssetIcon(selectedMarker.asset.asset_type)}
              </div>
              Asset Details
            </h3>
            <button 
              onClick={() => setSelectedMarker(null)} 
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Asset Info */}
            <div>
              <h4 className="font-semibold text-gray-900 text-lg mb-2">
                {selectedMarker.asset.asset_name}
              </h4>
              <div className="flex items-center space-x-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedMarker.asset.linked_devices?.length > 0
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedMarker.asset.asset_type}
                </span>
                <span className="text-xs text-gray-600">ID: {selectedMarker.asset.asset_id}</span>
              </div>
              
              {selectedMarker.asset.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {selectedMarker.asset.description}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded">
              <div className="flex items-center text-sm mb-2">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium text-gray-800">Asset Location</span>
              </div>
              <div className="space-y-2">
                <div className="font-mono text-sm bg-white p-2 rounded">
                  {selectedMarker.latitude.toFixed(6)}, {selectedMarker.longitude.toFixed(6)}
                </div>
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Latitude:</span>
                    <span className="font-medium">{selectedMarker.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitude:</span>
                    <span className="font-medium">{selectedMarker.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Radius:</span>
                    <span className="font-medium">{selectedMarker.asset.registered_location.radius} km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Devices Summary */}
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Link className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="font-medium text-gray-800">Linked Devices</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedMarker.asset.linked_devices?.length > 0
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedMarker.asset.linked_devices?.length || 0} devices
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                {selectedMarker.asset.linked_devices && selectedMarker.asset.linked_devices.length > 0 ? (
                  <div className="space-y-3">
                    {selectedMarker.asset.linked_devices.map((device, index) => (
                      <div key={index} className="border border-gray-100 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-900">{device.device_name}</div>
                            <div className="text-xs text-gray-500">{device.device_id}</div>
                            {device.device_model && (
                              <div className="text-xs text-gray-500">Model: {device.device_model}</div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            device.device_status === 'online'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {device.device_status}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          {device.battery_level !== null && (
                            <div className="flex items-center">
                              <Battery className="w-3 h-3 mr-1" />
                              Battery: {device.battery_level}%
                            </div>
                          )}
                          <div>
                            Linked: {new Date(device.linked_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Link className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No devices linked to this asset</p>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Metadata */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(selectedMarker.asset.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{new Date(selectedMarker.asset.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Error Message */}
      {mapError && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-gray-100 bg-opacity-90">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Error</h3>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null);
                initializeMap();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retry Loading Map
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay for map */}
      {!mapInitializedRef.current && !mapError && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing map...</p>
            <p className="text-sm text-gray-500 mt-2">
              {filteredAssets.length > 0
  ? `Found ${filteredAssets.length} assets`
  : 'Loading assets...'}

            </p>
          </div>
        </div>
      )}

      {/* Leaflet Map Container */}
      <div 
        id="map" 
        className="w-full h-full z-0"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#e5e7eb',
        }}
      />
    </div>
  );
}
