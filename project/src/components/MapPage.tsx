// src/components/MapPage.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Polyline } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster"; // ensure installed
import axios from "axios";

/**
 * Config
 */
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const POLL_INTERVAL_MS = 5000; // poll every 5s
const DEFAULT_CENTER: LatLngExpression = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

/**
 * Small debounce helper (no lodash dependency)
 */
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 150) {
  let t: number | null = null;
  const debounced = (...args: any[]) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => {
    if (t) window.clearTimeout(t);
    t = null;
  };
  return debounced as T & { cancel?: () => void };
}

/**
 * Fix Leaflet default image paths (if using local /public files)
 * If you prefer CDN, these may not be required.
 */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

/**
 * Custom icon factory for rotating vehicle arrow (divIcon)
 */
function createVehicleDivIcon(heading = 0, color = "#ef4444", size = 36) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(12,12) rotate(${heading}) translate(-12,-12)">
        <path d="M12 2 L3 21 L21 21 Z" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
      </g>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "vehicle-div-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size * 0.9],
  });
}

/**
 * Active icon (bigger green)
 */
const ACTIVE_ICON = createVehicleDivIcon(0, "#16a34a", 48);
/**
 * Default icon (red)
 */
const DEFAULT_ICON = createVehicleDivIcon(0, "#ef4444", 36);

/**
 * Device icon fallback
 */
const DEVICE_ICON = L.icon({
  iconUrl: "/icons/device-red.png", // put a small png in public/icons or replace with a URL
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/**
 * Helper for smooth animation of marker from -> to
 */
function animateMarkerPosition(marker: L.Marker, from: L.LatLng, to: L.LatLng, duration = 700) {
  const start = performance.now();
  function step(now: number) {
    const t = Math.min((now - start) / duration, 1);
    const lat = from.lat + (to.lat - from.lat) * t;
    const lng = from.lng + (to.lng - from.lng) * t;
    marker.setLatLng([lat, lng]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/**
 * Set map view when center changes
 */
function SetView({ center, zoom }: { center: LatLngExpression | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, typeof zoom === "number" ? zoom : map.getZoom(), { animate: true, duration: 0.6 });
  }, [center, zoom, map]);
  return null;
}

/**
 * Types
 */
type GeoPoint = { latitude: number; longitude: number };
type AssetCurrent = {
  id?: string;
  asset_id?: string;
  asset_name?: string;
  asset_type?: string;
  location: GeoPoint;
  timestamp?: string;
  status?: string;
  alert?: string | null;
};

/**
 * Main MapPage component
 */
export default function MapPage(): JSX.Element {
  const [assets, setAssets] = useState<AssetCurrent[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [routePoints, setRoutePoints] = useState<LatLngExpression[] | null>(null);
  const [center, setCenter] = useState<LatLngExpression | null>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [filterType, setFilterType] = useState<string>("all");
  const [alertsOnly, setAlertsOnly] = useState<boolean>(false);
  const [searchVal, setSearchVal] = useState<string>("");

  // map + cluster + markers refs
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // polling ref
  const pollRef = useRef<number | null>(null);

  // ---------- fetch current assets ----------
  const fetchCurrent = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/assets/current`);
      const data = Array.isArray(res.data) ? res.data : res.data.items ?? [];
      const normalized: AssetCurrent[] = data
        .map((d: any) => {
          const asset_id = d.asset_id ?? d.assetId ?? d.asset?.asset_id;
          const lat = d.location?.latitude ?? d.location?.lat ?? d.latitude ?? d.lat;
          const lng = d.location?.longitude ?? d.location?.lng ?? d.longitude ?? d.lng;
          return {
            id: d.id ?? d._id ?? asset_id ?? String(Math.random()),
            asset_id,
            asset_name: d.asset_name ?? d.asset_name ?? d.name,
            asset_type: d.asset_type ?? d.asset_type ?? d.type,
            location: { latitude: Number(lat), longitude: Number(lng) },
            timestamp: d.timestamp ?? d.last_seen,
            status: d.status,
            alert: d.alert ?? null,
          };
        })
        .filter((a) => !Number.isNaN(a.location.latitude) && !Number.isNaN(a.location.longitude));
      setAssets(normalized);
      // if no center set to something sensible
      if ((!center || (center[0] === DEFAULT_CENTER[0] && center[1] === DEFAULT_CENTER[1])) && normalized.length > 0) {
        setCenter([normalized[0].location.latitude, normalized[0].location.longitude]);
      }
    } catch (err) {
      console.error("Failed to fetch /assets/current", err);
    }
  }, [center]);

  // ---------- update cluster markers ----------
  const updateMarkers = useCallback(() => {
    if (!mapRef.current) return;
    if (!clusterRef.current) {
      clusterRef.current = (L as any).markerClusterGroup();
      clusterRef.current.addTo(mapRef.current);
    }
    const cluster = clusterRef.current!;
    const keepKeys = new Set<string>();

    // add/update asset markers
    assets.forEach((a) => {
      const key = `asset-${a.asset_id ?? a.id}`;
      keepKeys.add(key);
      const latLng = L.latLng(a.location.latitude, a.location.longitude);
      const existing = markersRef.current[key];

      if (existing) {
        const from = existing.getLatLng();
        if (!from.equals(latLng)) {
          animateMarkerPosition(existing as any, from, latLng, 700);
        }
        existing.setPopupContent(makeAssetPopupHtml(a));
        // highlight selected
        if (selectedAssetId && (a.id === selectedAssetId || a.asset_id === selectedAssetId)) {
          existing.setIcon(ACTIVE_ICON);
        } else {
          // alert assets show orange icon
          const color = a.alert ? "#f97316" : "#ef4444";
          existing.setIcon(createVehicleDivIcon(0, color, 36));
        }
      } else {
        const icon = a.alert ? createVehicleDivIcon(0, "#f97316", 36) : DEFAULT_ICON;
        const m = L.marker(latLng, { icon });
        m.bindPopup(makeAssetPopupHtml(a));
        m.on("click", () => {
          // when marker clicked, select + fetch route
          selectAsset(a);
        });
        markersRef.current[key] = m;
        cluster.addLayer(m);
      }
    });

    // remove stale markers
    Object.keys(markersRef.current).forEach((k) => {
      if (!keepKeys.has(k)) {
        const m = markersRef.current[k];
        cluster.removeLayer(m);
        delete markersRef.current[k];
      }
    });
  }, [assets, selectedAssetId]);

  // create popup html for asset
  function makeAssetPopupHtml(a: AssetCurrent) {
    const online = !a.timestamp || Date.now() - new Date(a.timestamp).getTime() < 2 * 60 * 1000;
    return `
      <div style="min-width:200px">
        <div style="font-weight:600">${a.asset_name ?? a.asset_id ?? "Asset"}</div>
        <div style="font-size:12px;color:#444">ID: ${a.asset_id ?? a.id}</div>
        <div style="font-size:12px;color:#444">Type: ${a.asset_type ?? "n/a"}</div>
        <div style="font-size:12px;color:#444">Status: ${a.status ?? "-"}</div>
        <div style="font-size:12px;color:${a.alert ? "crimson" : "#666"}">${a.alert ? "⚠️ " + a.alert : ""}</div>
        <div style="margin-top:8px;display:flex;gap:6px">
          <button id="track-btn" style="padding:6px 8px;background:#2563eb;color:white;border-radius:4px;border:none;cursor:pointer">Track</button>
          <button id="route-btn" style="padding:6px 8px;background:#10b981;color:white;border-radius:4px;border:none;cursor:pointer">Show Route</button>
        </div>
      </div>
    `;
  }

  // When user clicks popup buttons we need to capture them after popupopen
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    function onPopupOpen(e: any) {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;
      const trackBtn = popupEl.querySelector("#track-btn") as HTMLButtonElement | null;
      const routeBtn = popupEl.querySelector("#route-btn") as HTMLButtonElement | null;
      // wire them: pulling asset id from popup text (simple)
      const idLine = popupEl.querySelector("div[style*='font-size:12px']")?.textContent ?? "";
      const match = idLine.match(/ID:\s*(.+)/);
      const assetId = match ? match[1].trim() : null;
      if (trackBtn && assetId) {
        trackBtn.onclick = () => {
          jumpToAsset(assetId);
        };
      }
      if (routeBtn && assetId) {
        routeBtn.onclick = () => {
          // find asset and load history
          const found = assets.find((x) => (x.asset_id ?? x.id) === assetId || x.id === assetId);
          if (found) selectAsset(found);
        };
      }
    }
    map.on("popupopen", onPopupOpen);
    return () => map.off("popupopen", onPopupOpen);
  }, [assets]);

  // ---------- select asset: highlight + fetch history ----------
  async function selectAsset(a: AssetCurrent) {
    setSelectedAssetId(a.id ?? a.asset_id ?? null);
    setCenter([a.location.latitude, a.location.longitude]);
    setZoom(15);

    // fetch route history from backend
    try {
      const identifier = encodeURIComponent(a.asset_id ?? a.id ?? "");
      const res = await axios.get(`${API}/assets/${identifier}/history?days=7`);
      const pts: LatLngExpression[] = (Array.isArray(res.data) ? res.data : [])
        .map((p: any) => {
          const lat = p.location?.latitude ?? p.latitude ?? p.lat;
          const lng = p.location?.longitude ?? p.longitude ?? p.lng;
          return [Number(lat), Number(lng)];
        })
        .filter((pt: any) => !Number.isNaN(pt[0]) && !Number.isNaN(pt[1]));
      setRoutePoints(pts.length > 0 ? pts : null);
      // open popup of selected marker
      setTimeout(() => {
        const marker = markersRef.current[`asset-${a.asset_id ?? a.id}`];
        marker?.openPopup();
      }, 300);
    } catch (err) {
      console.warn("Failed to fetch history for", a, err);
      setRoutePoints(null);
    }
  }

  // ---------- jump to asset by id (search) ----------
  async function jumpToAsset(assetId: string) {
    assetId = assetId.trim();
    if (!assetId) return;
    // first try local assets
    const found = assets.find((a) => (a.asset_id ?? a.id) === assetId || a.id === assetId);
    if (found) {
      selectAsset(found);
      return;
    }
    // fallback to API /assets/by-asset/{asset_id}
    try {
      const res = await axios.get(`${API}/assets/by-asset/${encodeURIComponent(assetId)}`);
      if (res.data) {
        const a = res.data;
        const lat = a.registered_location?.latitude ?? a.registered_location?.lat;
        const lng = a.registered_location?.longitude ?? a.registered_location?.lng;
        if (lat && lng) {
          const asset: AssetCurrent = {
            id: a.id ?? a._id ?? a.asset_id,
            asset_id: a.asset_id,
            asset_name: a.asset_name,
            asset_type: a.asset_type,
            location: { latitude: Number(lat), longitude: Number(lng) },
            timestamp: a.updated_at,
            status: undefined,
          };
          setAssets((s) => {
            // add to local assets if missing
            if (!s.find((x) => (x.asset_id ?? x.id) === (asset.asset_id ?? asset.id))) {
              return [...s, asset];
            }
            return s;
          });
          selectAsset(asset);
          return;
        }
      }
      alert("Asset not found");
    } catch (err) {
      console.warn("Jump fetch failed:", err);
      alert("Asset not found");
    }
  }

  // ---------- polling lifecycle ----------
  useEffect(() => {
    // initial load
    (async () => {
      await fetchCurrent();
    })();

    // start polling
    pollRef.current = window.setInterval(async () => {
      await fetchCurrent();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchCurrent]);

  // update markers whenever assets change
  useEffect(() => {
    updateMarkers();
  }, [assets, updateMarkers]);

  // change icons when selected asset changes (highlight)
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([key, m]) => {
      const id = key.replace(/^asset-/, "");
      if (selectedAssetId && (id === selectedAssetId)) {
        m.setIcon(ACTIVE_ICON);
        m.openPopup();
      } else if (key.startsWith("asset-")) {
        // reset icon to default/alert color
        const asset = assets.find((x) => (x.asset_id ?? x.id) === id || x.id === id);
        const color = asset?.alert ? "#f97316" : "#ef4444";
        m.setIcon(createVehicleDivIcon(0, color, 36));
      }
    });
  }, [selectedAssetId, assets]);

  // ---------- UI filter & search ----------
  const filteredAssets = assets.filter((a) => {
    if (alertsOnly && !a.alert) return false;
    if (filterType !== "all" && a.asset_type !== filterType) return false;
    if (!searchVal) return true;
    const s = searchVal.toLowerCase();
    return (a.asset_id ?? "").toLowerCase().includes(s) || (a.asset_name ?? "").toLowerCase().includes(s);
  });

  // debounced input handler
  const debouncedSetSearch = useRef(debounce((v: string) => setSearchVal(v), 120)).current;

  // ---------- map created callback ----------
  const onMapCreated = (mapInstance: L.Map) => {
    mapRef.current = mapInstance;
    if (!clusterRef.current) {
      clusterRef.current = (L as any).markerClusterGroup();
      clusterRef.current.addTo(mapInstance);
    }
  };

  // ---------- clean up on unmount ----------
  useEffect(() => {
    return () => {
      // remove cluster and markers to avoid leaks
      if (clusterRef.current && mapRef.current) {
        clusterRef.current.clearLayers();
        mapRef.current.removeLayer(clusterRef.current);
      }
    };
  }, []);

  // ---------- JSX ----------
  return (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r p-3 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Assets</h2>
          <div className="text-sm">
            <button
              onClick={() => {
                setAlertsOnly((s) => !s);
              }}
              className={`px-2 py-1 rounded ${alertsOnly ? "bg-red-600 text-white" : "bg-gray-100"}`}
            >
              {alertsOnly ? "Alerts: ON" : "Alerts"}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <input
            type="text"
            placeholder="Search by asset id or name..."
            onChange={(e) => debouncedSetSearch(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                debouncedSetSearch.cancel?.();
                setSearchVal("");
                (document.querySelector('input') as HTMLInputElement | null)?.focus();
              }}
              className="px-2 py-1 bg-gray-100 rounded"
            >
              Reset
            </button>
            <button
              onClick={() => {
                const val = (document.querySelector('input') as HTMLInputElement | null)?.value ?? "";
                jumpToAsset(val);
              }}
              className="px-2 py-1 bg-blue-600 text-white rounded"
            >
              Jump
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm">Type filter</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full p-2 border rounded mt-1">
            <option value="all">All</option>
            <option value="vehicle">vehicle</option>
            <option value="machine">machine</option>
            <option value="person">person</option>
          </select>
        </div>

        <div>
          {filteredAssets.length === 0 && <div className="text-sm text-gray-500">No assets found.</div>}
          {filteredAssets.map((a) => {
            const key = a.asset_id ?? a.id;
            const isSelected = selectedAssetId === (a.id ?? a.asset_id);
            const online = !a.timestamp || Date.now() - new Date(a.timestamp).getTime() < 2 * 60 * 1000;
            return (
              <div
                key={key}
                className={`p-2 border rounded mb-2 cursor-pointer ${isSelected ? "bg-blue-50" : "bg-white"}`}
                onClick={() => selectAsset(a)}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{a.asset_name ?? a.asset_id ?? key}</div>
                    <div className="text-xs text-gray-600">{a.asset_type ?? "type unknown"}</div>
                    <div className="text-xs text-gray-500">{a.status ?? ""}</div>
                    {a.alert && <div className="text-xs text-red-600 font-bold">⚠️ {a.alert}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${online ? "text-green-600" : "text-gray-400"}`}>{online ? "online" : "offline"}</div>
                    <div className="text-xs text-gray-400">
                      {a.location.latitude.toFixed(4)}, {a.location.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <MapContainer
          center={center || DEFAULT_CENTER}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(mapInstance) => onMapCreated(mapInstance)}
        >
          <SetView center={center} zoom={zoom} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

          {/* route polyline */}
          {routePoints && routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: "#1d4ed8", weight: 4 }} />}
        </MapContainer>
      </main>
    </div>
  );
}


// // src/components/MapPage.tsx
// import React, { useEffect, useRef, useState } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   useMapEvent,
//   Popup,
//   Polyline,
//   useMap
// } from "react-leaflet";
// import L, { LatLngExpression, DivIcon } from "leaflet";
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster";
// import axios from "axios";
// import debounce from "lodash.debounce";

// /**
//  * CONFIG
//  */
// const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
// const POLL_INTERVAL_MS = 4000; // polling interval for live updates
// // endpoint choice: '/assets/current' or '/assets/with-locations'
// const ASSETS_ENDPOINT = "/assets/current";

// /**
//  * Utilities: SVG div icon for vehicle that can be colored and rotated
//  */
// function createVehicleDivIcon(heading = 0, color = "#ef4444", size = 36, scale = 1) {
//   const w = Math.round(size * scale);
//   const svg = `
//   <svg width="${w}" height="${w}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
//     <g transform="translate(12,12) rotate(${heading}) translate(-12,-12)">
//       <path d="M12 2 L3 21 L21 21 Z" fill="${color}" stroke="#fff" stroke-width="0.6"/>
//     </g>
//   </svg>`;
//   return L.divIcon({
//     html: svg,
//     className: "vehicle-div-icon",
//     iconSize: [w, w],
//     iconAnchor: [w / 2, w / 2 + 6],
//   }) as DivIcon;
// }

// /**
//  * Small highlighted icon for "active" asset (larger + glow)
//  */
// function createHighlightedIcon(heading = 0) {
//   return createVehicleDivIcon(heading, "#06b6d4", 48, 1.2);
// }

// /**
//  * Hook: programmatic map view setter
//  */
// function SetMapView({ center, zoom }: { center: LatLngExpression | null; zoom?: number }) {
//   const map = useMap();
//   useEffect(() => {
//     if (!center) return;
//     map.setView(center, typeof zoom === "number" ? zoom : map.getZoom(), {
//       animate: true,
//       duration: 0.8,
//     });
//   }, [center, zoom, map]);
//   return null;
// }

// /**
//  * MAIN COMPONENT
//  */
// export default function MapPage(): JSX.Element {
//   // data/state
//   const [assets, setAssets] = useState<any[]>([]); // normalized assets
//   const [filterType, setFilterType] = useState<string>("all");
//   const [search, setSearch] = useState("");
//   const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
//   const [routePoints, setRoutePoints] = useState<{ lat: number; lng: number }[] | null>(null);
//   const [mapCenter, setMapCenter] = useState<LatLngExpression | null>([12.9716, 77.5946]);
//   const [zoom, setZoom] = useState<number>(12);
//   const [followMode, setFollowMode] = useState(false);

//   // Refs
//   const mapRef = useRef<L.Map | null>(null);
//   const clusterRef = useRef<any>(null);
//   const markersRef = useRef<Record<string, L.Marker>>({});
//   const positionsRef = useRef<Record<string, { lat: number; lng: number }>>({});
//   const pollRef = useRef<number | null>(null);

//   // Alerts list for right-side alerts sidebar
//   const [alerts, setAlerts] = useState<
//     { asset_id: string; type: string; message: string; ts: string; severity?: string }[]
//   >([]);

//   // available types for filter (computed)
//   const assetTypes = Array.from(new Set(assets.map((a) => a.asset_type).filter(Boolean)));

//   // normalize backend payload to our shape
//   function normalize(item: any) {
//     // Location may come in different fields
//     const id = String(item.id ?? item._id ?? item.asset_id ?? item.assetId ?? item.asset?.asset_id ?? Math.random());
//     const asset_id = item.asset_id ?? item.assetId ?? item.asset?.asset_id ?? id;
//     const lat = item.location?.latitude ?? item.location?.lat ?? item.latitude ?? item.lat ?? item.registered_location?.latitude ?? item.registered_location?.lat;
//     const lng = item.location?.longitude ?? item.location?.lng ?? item.longitude ?? item.lng ?? item.registered_location?.longitude ?? item.registered_location?.lng;
//     const status = item.status ?? item.state ?? "unknown";
//     const last_seen = item.timestamp ?? item.last_seen ?? item.updated_at ?? null;
//     const asset_type = item.asset_type ?? item.assetType ?? item.asset_type;
//     // optional alerts array (backend may provide)
//     const assetAlerts = item.alerts ?? item.alert ?? [];
//     return { id, asset_id, lat: Number(lat), lng: Number(lng), status, last_seen, asset_type, alerts: assetAlerts };
//   }

//   // Fetch assets once (and populate positions)
//   async function fetchAssetsOnce() {
//     try {
//       const res = await axios.get(`${API}${ASSETS_ENDPOINT}`);
//       const arr = Array.isArray(res.data) ? res.data : res.data.items ?? [];
//       const normalized = arr.map(normalize).filter((x) => !isNaN(x.lat) && !isNaN(x.lng));
//       // initialize positionsRef for smooth movement
//       const dp = { ...positionsRef.current };
//       normalized.forEach((a) => {
//         if (!dp[a.id]) dp[a.id] = { lat: a.lat, lng: a.lng };
//       });
//       positionsRef.current = dp;
//       setAssets(normalized);
//       // populate alerts array from assets (simple merge)
//       const foundAlerts: any[] = [];
//       normalized.forEach((a) => {
//         if (a.alerts && a.alerts.length) {
//           (a.alerts as any[]).forEach((al: any) => {
//             foundAlerts.push({
//               asset_id: a.asset_id,
//               type: al.type ?? "alert",
//               message: al.message ?? JSON.stringify(al),
//               ts: al.ts ?? a.last_seen,
//               severity: al.severity ?? "medium",
//             });
//           });
//         }
//       });
//       setAlerts(foundAlerts);
//     } catch (err) {
//       console.error("fetchAssetsOnce failed", err);
//     }
//   }

//   // POLLING: updates & animation
//   function startPolling() {
//     if (pollRef.current) return;
//     pollRef.current = window.setInterval(async () => {
//       try {
//         const res = await axios.get(`${API}${ASSETS_ENDPOINT}`);
//         const arr = Array.isArray(res.data) ? res.data : res.data.items ?? [];
//         const normalized = arr.map(normalize).filter((x) => !isNaN(x.lat) && !isNaN(x.lng));
//         // animate markers by moving underlying L.Marker positions smoothly
//         updateMarkersPositions(normalized);
//         setAssets(normalized);
//         // update alerts list live
//         const newAlerts: any[] = [];
//         normalized.forEach((a) => {
//           if (a.alerts && a.alerts.length) {
//             (a.alerts as any[]).forEach((al: any) => {
//               newAlerts.push({
//                 asset_id: a.asset_id,
//                 type: al.type ?? "alert",
//                 message: al.message ?? JSON.stringify(al),
//                 ts: al.ts ?? a.last_seen,
//                 severity: al.severity ?? "medium",
//               });
//             });
//           }
//         });
//         setAlerts(newAlerts);
//       } catch (err) {
//         console.warn("Polling error", err);
//       }
//     }, POLL_INTERVAL_MS);
//   }
//   function stopPolling() {
//     if (pollRef.current) {
//       window.clearInterval(pollRef.current);
//       pollRef.current = null;
//     }
//   }

//   useEffect(() => {
//     fetchAssetsOnce();
//     startPolling();
//     return () => {
//       stopPolling();
//       // remove cluster if exists
//       if (clusterRef.current && mapRef.current) {
//         clusterRef.current.clearLayers();
//         mapRef.current.removeLayer(clusterRef.current);
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /**
//    * MARKER & CLUSTER MANAGEMENT
//    *
//    * We'll keep a cluster group on the raw Leaflet map instance.
//    * On each update we: create markers if missing, animate existing markers, and update cluster layer.
//    */

//   // Create cluster group if missing
//   function ensureCluster(map: L.Map) {
//     if (!clusterRef.current) {
//       // @ts-ignore - MarkerClusterGroup typing sometimes unavailable
//       clusterRef.current = (L as any).markerClusterGroup({
//         chunkedLoading: true,
//         spiderfyOnMaxZoom: true,
//         removeOutsideVisibleBounds: true,
//       });
//       map.addLayer(clusterRef.current);
//     }
//     return clusterRef.current;
//   }

//   // Create or update markers from assets array
//   function rebuildMarkersOnMap(map: L.Map, list: any[]) {
//     const cluster = ensureCluster(map);
//     // We'll reuse existing markersRef where possible
//     const keepIds = new Set(list.map((a) => a.id));
//     // remove markers no longer present
//     Object.keys(markersRef.current).forEach((id) => {
//       if (!keepIds.has(id)) {
//         const m = markersRef.current[id];
//         if (cluster && m) cluster.removeLayer(m);
//         try {
//           m.remove();
//         } catch {}
//         delete markersRef.current[id];
//       }
//     });

//     list.forEach((a) => {
//       const pos = { lat: a.lat, lng: a.lng };
//       positionsRef.current[a.id] = positionsRef.current[a.id] ?? pos;
//       const existing = markersRef.current[a.id];
//       const color = a.status === "on-trip" ? "#0ea5e9" : a.status === "idle" ? "#10b981" : "#ef4444";
//       const heading = a.heading ?? 0;
//       const icon = selectedAssetId === a.id ? createHighlightedIcon(heading) : createVehicleDivIcon(heading, color);
//       if (existing) {
//         // update popup content if needed
//         existing.setIcon(icon);
//         existing.bindPopup(makePopupContent(a), { minWidth: 200, maxWidth: 260 });
//         // marker position updated in animate step, we won't set here
//       } else {
//         // create raw Leaflet marker (so we can animate with setLatLng)
//         const m = L.marker([pos.lat, pos.lng], { icon });
//         m.bindPopup(makePopupContent(a), { minWidth: 200, maxWidth: 260 });
//         m.on("click", () => {
//           onMarkerClick(a);
//         });
//         markersRef.current[a.id] = m;
//         cluster.addLayer(m);
//       }
//     });
//   }

//   // Build popup HTML (string) — simple
//   function makePopupContent(a: any) {
//     const last = a.last_seen ? new Date(a.last_seen).toLocaleString() : "-";
//     const alertHtml = (a.alerts && a.alerts.length)
//       ? `<div style="padding:6px;border-left:4px solid #f59e0b;margin-top:6px;">
//            <strong>Alerts:</strong>
//            <ul style="margin:6px 0 0 14px;">${(a.alerts as any[]).map((al: any) => `<li>${al.type ?? "alert"}: ${al.message ?? JSON.stringify(al)}</li>`).join("")}</ul>
//          </div>`
//       : "";
//     return `
//       <div style="font-size:13px;">
//         <div style="font-weight:600;margin-bottom:4px;">${a.asset_id ?? a.id}</div>
//         <div style="font-size:12px;color:#555;">Type: ${a.asset_type ?? "—"} | Status: ${a.status ?? "—"}</div>
//         <div style="font-size:12px;color:#666;margin-top:6px;">Last seen: ${last}</div>
//         ${alertHtml}
//         <div style="margin-top:8px;display:flex;gap:8px;">
//           <button id="track-${a.id}" style="padding:6px 8px;background:#0ea5e9;color:#fff;border-radius:6px;border:0;cursor:pointer;">Track</button>
//           <button id="center-${a.id}" style="padding:6px 8px;border-radius:6px;border:1px solid #ddd;cursor:pointer;">Center</button>
//         </div>
//       </div>
//     `;
//   }

//   // Called when a marker is clicked
//   async function onMarkerClick(a: any) {
//     // show route history
//     await fetchRouteForAsset(a);
//     // open popup programmatically (marker click already handled by leaflet)
//     setSelectedAssetId(a.id);
//     setMapCenter([a.lat, a.lng]);
//     setZoom(15);
//     setFollowMode(true);
//     // ensure marker highlight
//     updateMarkerIcons();
//   }

//   // update icon for selected vs others
//   function updateMarkerIcons() {
//     Object.values(markersRef.current).forEach((m: L.Marker) => {
//       const id = Object.keys(markersRef.current).find((k) => markersRef.current[k] === m);
//       if (!id) return;
//       const asset = assets.find((x) => x.id === id);
//       const heading = asset?.heading ?? 0;
//       const color = asset?.status === "on-trip" ? "#0ea5e9" : asset?.status === "idle" ? "#10b981" : "#ef4444";
//       const icon = id === selectedAssetId ? createHighlightedIcon(heading) : createVehicleDivIcon(heading, color);
//       m.setIcon(icon);
//     });
//   }

//   // Smooth animation: move markers from positionsRef to new coords
//   function updateMarkersPositions(newAssets: any[]) {
//     // for each asset, animate
//     const now = performance.now();
//     newAssets.forEach((a) => {
//       const id = a.id;
//       const to = { lat: a.lat, lng: a.lng };
//       const from = positionsRef.current[id] ?? to;
//       positionsRef.current[id] = from;
//       // if marker exists, animate via requestAnimationFrame
//       const m = markersRef.current[id];
//       if (!m) {
//         // will be created in rebuildMarkersOnMap next cycle
//         return;
//       }
//       // quick distance check
//       const distance = Math.hypot(from.lat - to.lat, from.lng - to.lng);
//       const duration = distance > 0.00001 ? 700 : 0; // ms
//       if (duration <= 0) {
//         positionsRef.current[id] = to;
//         m.setLatLng([to.lat, to.lng]);
//         return;
//       }
//       const start = performance.now();
//       function step(tNow: number) {
//         const t = Math.min((tNow - start) / duration, 1);
//         const lat = from.lat + (to.lat - from.lat) * t;
//         const lng = from.lng + (to.lng - from.lng) * t;
//         positionsRef.current[id] = { lat, lng };
//         m.setLatLng([lat, lng]);
//         // if marker is being followed, update center
//         if (followMode && selectedAssetId === id) {
//           setMapCenter([lat, lng]);
//         }
//         if (t < 1) requestAnimationFrame(step);
//       }
//       requestAnimationFrame(step);
//     });

//     // After updating positions, also rebuild cluster layer to reflect icons if needed
//     if (mapRef.current) rebuildMarkersOnMap(mapRef.current, newAssets);
//     updateMarkerIcons();
//   }

//   /**
//    * Route history: fetch and draw polyline when user clicks asset
//    */
//   async function fetchRouteForAsset(a: any) {
//     try {
//       // use asset_id for history endpoint if backend expects asset_id; try both id & asset_id
//       const assetIdCandidate = a.asset_id ?? a.id;
//       const res = await axios.get(`${API}/assets/${encodeURIComponent(assetIdCandidate)}/history?days=7`);
//       const rows: any[] = Array.isArray(res.data) ? res.data : res.data.items ?? [];
//       const pts = rows
//         .map((r) => {
//           const lat = r.location?.latitude ?? r.location?.lat ?? r.lat ?? r.latitude;
//           const lng = r.location?.longitude ?? r.location?.lng ?? r.lng ?? r.longitude;
//           return { lat: Number(lat), lng: Number(lng) };
//         })
//         .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
//       // show last N points (reverse so earliest -> latest)
//       setRoutePoints(pts.slice(0, 200));
//     } catch (err) {
//       console.warn("Failed to fetch history", err);
//       setRoutePoints(null);
//     }
//   }

//   /**
//    * MAP creation callback: when map is ready, we create cluster group and markers
//    */
//   function onMapCreated(map: L.Map) {
//     mapRef.current = map;
//     ensureCluster(map);
//     // initial populate
//     rebuildMarkersOnMap(map, assets);

//     // attach popup click delegation to handle in-popup buttons (Track / Center)
//     map.on("popupopen", (ev: any) => {
//       const px = ev.popup._source; // marker
//       // find asset id by marker
//       const foundId = Object.keys(markersRef.current).find((k) => markersRef.current[k] === px);
//       if (!foundId) {
//         // possible if popup opened from external HTML; try to parse asset id from HTML (ids in button)
//         const content = ev.popup.getContent?.();
//         if (typeof content === "string") {
//           const trackIdMatch = content.match(/id="track-([^"]+)"/);
//           if (trackIdMatch) {
//             const aid = trackIdMatch[1];
//             document.getElementById(`track-${aid}`)?.addEventListener("click", async () => {
//               const asset = assets.find((x) => x.id === aid);
//               if (asset) {
//                 setSelectedAssetId(aid);
//                 await fetchRouteForAsset(asset);
//                 setFollowMode(true);
//               }
//             });
//             document.getElementById(`center-${aid}`)?.addEventListener("click", () => {
//               const asset = assets.find((x) => x.id === aid);
//               if (asset) {
//                 setMapCenter([asset.lat, asset.lng]);
//                 setZoom(15);
//               }
//             });
//           }
//         }
//         return;
//       }
//       const aid = foundId;
//       // attach button events if the popup content has the buttons
//       document.getElementById(`track-${aid}`)?.addEventListener("click", async () => {
//         const asset = assets.find((x) => x.id === aid);
//         if (asset) {
//           setSelectedAssetId(aid);
//           await fetchRouteForAsset(asset);
//           setFollowMode(true);
//         }
//       });
//       document.getElementById(`center-${aid}`)?.addEventListener("click", () => {
//         const asset = assets.find((x) => x.id === aid);
//         if (asset) {
//           setMapCenter([asset.lat, asset.lng]);
//           setZoom(15);
//         }
//       });
//     });

//     // initial rebuild on map ready
//     rebuildMarkersOnMap(map, assets);
//   }

//   // whenever assets update, ask map to rebuild markers
//   useEffect(() => {
//     if (!mapRef.current) return;
//     rebuildMarkersOnMap(mapRef.current, assets.filter(filterByTypeAndSearch));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [assets, selectedAssetId, filterType, search]);

//   // filter function
//   function filterByTypeAndSearch(a: any) {
//     if (filterType !== "all" && a.asset_type !== filterType) return false;
//     if (search && !String(a.asset_id ?? a.id).toLowerCase().includes(search.toLowerCase())) return false;
//     return true;
//   }

//   // Search debounce
//   const onSearch = debounce((val: string) => {
//     setSearch(val);
//   }, 250);

//   // user selects asset from sidebar: center & fetch route
//   async function onSelectFromSidebar(a: any) {
//     setSelectedAssetId(a.id);
//     setMapCenter([a.lat, a.lng]);
//     setZoom(15);
//     setFollowMode(true);
//     // open popup if marker present
//     const m = markersRef.current[a.id];
//     if (m && mapRef.current) {
//       m.openPopup();
//     }
//     await fetchRouteForAsset(a);
//     updateMarkerIcons();
//   }

//   // helper to highlight active asset visually
//   useEffect(() => {
//     updateMarkerIcons();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedAssetId]);

//   // handle map clicks when user wants to disable follow
//   function MapClickHandler() {
//     // clicking on map disables followMode
//     useMapEvent("click", () => {
//       setFollowMode(false);
//     });
//     return null;
//   }

//   // small helper to compute online/offline
//   function isOnline(last_seen?: string | null) {
//     if (!last_seen) return true;
//     const diff = Date.now() - new Date(last_seen).getTime();
//     return diff < 2 * 60 * 1000; // online if seen within 2 minutes
//   }

//   // UI render
//   return (
//     <div className="w-full h-screen flex">
//       {/* Left Sidebar */}
//       <div className="w-96 bg-white border-r p-4 flex flex-col gap-4">
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold">Assets</h2>
//           <div className="text-sm text-gray-500">Live</div>
//         </div>

//         {/* Search + Filters */}
//         <div className="flex gap-2">
//           <input
//             placeholder="Search by asset id..."
//             className="flex-1 px-3 py-2 border rounded"
//             onChange={(e) => onSearch(e.target.value)}
//           />
//           <select
//             value={filterType}
//             onChange={(e) => setFilterType(e.target.value)}
//             className="px-2 py-2 border rounded"
//           >
//             <option value="all">All types</option>
//             {assetTypes.map((t) => (
//               <option key={t} value={t}>{t}</option>
//             ))}
//           </select>
//         </div>

//         {/* Action buttons */}
//         <div className="flex gap-2">
//           <button
//             onClick={() => { setSearch(""); setFilterType("all"); setRoutePoints(null); setSelectedAssetId(null); }}
//             className="px-3 py-2 bg-gray-100 rounded"
//           >
//             Reset
//           </button>
//           <button
//             onClick={() => { setFollowMode((s) => !s); }}
//             className={`px-3 py-2 rounded ${followMode ? "bg-blue-600 text-white" : "bg-gray-100"}`}
//           >
//             {followMode ? "Following" : "Follow"}
//           </button>
//         </div>

//         {/* Assets list */}
//         <div className="flex-1 overflow-auto space-y-2">
//           {assets.filter(filterByTypeAndSearch).map((a) => {
//             const dp = positionsRef.current[a.id] ?? { lat: a.lat, lng: a.lng };
//             const online = isOnline(a.last_seen);
//             const active = selectedAssetId === a.id;
//             return (
//               <div
//                 key={a.id}
//                 className={`p-2 border rounded cursor-pointer flex justify-between items-center ${active ? "bg-blue-50 border-blue-200" : "bg-white"}`}
//                 onClick={() => onSelectFromSidebar(a)}
//               >
//                 <div>
//                   <div className="font-medium text-sm">{a.asset_id ?? a.id}</div>
//                   <div className="text-xs text-gray-500">
//                     {a.asset_type ?? "—"} • {a.status ?? "—"} • {online ? "online" : "offline"}
//                   </div>
//                 </div>
//                 <div className="text-right text-xs text-gray-400">
//                   <div>{dp.lat.toFixed(4)}</div>
//                   <div>{dp.lng.toFixed(4)}</div>
//                 </div>
//               </div>
//             );
//           })}
//           {assets.length === 0 && <div className="text-sm text-gray-500">No assets found.</div>}
//         </div>

//         {/* Alerts summary */}
//         <div className="pt-2 border-t">
//           <div className="flex items-center justify-between">
//             <h4 className="font-semibold">Alerts</h4>
//             <div className="text-sm text-gray-500">{alerts.length}</div>
//           </div>
//           <div className="mt-2 space-y-2 max-h-40 overflow-auto">
//             {alerts.map((al, idx) => (
//               <div key={idx} className="p-2 bg-yellow-50 border rounded text-sm">
//                 <div className="font-medium">{al.asset_id}</div>
//                 <div className="text-xs text-gray-700">{al.type} • {al.message}</div>
//                 <div className="text-xs text-gray-500">{new Date(al.ts ?? Date.now()).toLocaleString()}</div>
//               </div>
//             ))}
//             {alerts.length === 0 && <div className="text-xs text-gray-500">No active alerts</div>}
//           </div>
//         </div>
//       </div>

//       {/* Map area */}
//       <div className="flex-1 relative">
//         <MapContainer
//           center={mapCenter as LatLngExpression}
//           zoom={zoom}
//           style={{ height: "100%", width: "100%" }}
//           whenCreated={onMapCreated}
//         >
//           <SetMapView center={mapCenter} zoom={zoom} />
//           <TileLayer
//             attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />
//           <MapClickHandler />
//           {/* route polyline for selected asset */}
//           {routePoints && routePoints.length > 1 && (
//             <Polyline
//               positions={routePoints.map((p) => [p.lat, p.lng] as LatLngExpression)}
//               color="#1d4ed8"
//               weight={4}
//               opacity={0.9}
//             />
//           )}
//         </MapContainer>
//       </div>

//       {/* Right-side alerts / details panel */}
//       <div className="w-80 bg-white border-l p-4 flex flex-col gap-3">
//         <h3 className="font-semibold">Details</h3>

//         {selectedAssetId ? (
//           <>
//             <div className="text-sm text-gray-600">Selected: {selectedAssetId}</div>
//             <div className="mt-2">
//               <button
//                 onClick={() => {
//                   const a = assets.find((x) => x.id === selectedAssetId);
//                   if (a) fetchRouteForAsset(a);
//                 }}
//                 className="px-3 py-2 bg-blue-600 text-white rounded"
//               >
//                 Refresh Route
//               </button>
//               <button
//                 onClick={() => {
//                   setSelectedAssetId(null);
//                   setRoutePoints(null);
//                   setFollowMode(false);
//                 }}
//                 className="ml-2 px-3 py-2 bg-gray-100 rounded"
//               >
//                 Clear
//               </button>
//             </div>
//             <div className="mt-3">
//               {/* show selected asset info */}
//               {(() => {
//                 const a = assets.find((x) => x.id === selectedAssetId);
//                 if (!a) return <div>No data.</div>;
//                 const dp = positionsRef.current[a.id] ?? { lat: a.lat, lng: a.lng };
//                 return (
//                   <div className="space-y-2 text-sm">
//                     <div><strong>ID:</strong> {a.asset_id}</div>
//                     <div><strong>Type:</strong> {a.asset_type}</div>
//                     <div><strong>Status:</strong> {a.status}</div>
//                     <div><strong>Last:</strong> {a.last_seen ? new Date(a.last_seen).toLocaleString() : "-"}</div>
//                     <div><strong>Coords:</strong> {dp.lat.toFixed(6)}, {dp.lng.toFixed(6)}</div>
//                     <div>
//                       <strong>Alerts:</strong>
//                       <ul className="list-disc ml-5">
//                         {(a.alerts && a.alerts.length) ? a.alerts.map((al: any, i: number) => <li key={i}>{al.type}: {al.message}</li>) : <li>None</li>}
//                       </ul>
//                     </div>
//                   </div>
//                 );
//               })()}
//             </div>
//           </>
//         ) : (
//           <div className="text-sm text-gray-500">No asset selected. Click a marker or use the list.</div>
//         )}

//         <div className="mt-auto text-xs text-gray-400">
//           Tip: click an asset to show route history and start tracking. Alerts are shown on markers, popups and here.
//         </div>
//       </div>
//     </div>
//   );
// }

// // src/pages/MapPage.tsx
// import React, { useEffect, useRef, useState, useCallback } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   useMap,
//   Popup,
//   Polyline,
//   Circle,
//   Polygon,
// } from "react-leaflet";
// import L, { LatLngExpression, Marker as LeafletMarker } from "leaflet";
// import "leaflet/dist/leaflet.css";
// import "leaflet.markercluster";
// import axios from "axios";
// import debounce from "lodash.debounce"; // optional, npm i lodash.debounce

// // -------- CONFIG ----------
// const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
// const POLL_INTERVAL_MS = 5000;
// const DEFAULT_CENTER: LatLngExpression = [12.9716, 77.5946];
// const DEFAULT_ZOOM = 12;

// // -------- Fix default icon paths (important) -------
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: "/leaflet/marker-icon-2x.png",
//   iconUrl: "/leaflet/marker-icon.png",
//   shadowUrl: "/leaflet/marker-shadow.png",
// });

// // -------- Custom icons (example) -------------------
// const assetIcon = new L.Icon({
//   iconUrl: "/icons/vehicle-blue.svg", // put SVG/PNG in public/icons/
//   iconSize: [36, 36],
//   iconAnchor: [18, 36],
// });

// const activeIcon = new L.Icon({
//   iconUrl: "/icons/vehicle-green.svg",
//   iconSize: [44, 44],
//   iconAnchor: [22, 44],
// });

// const deviceIcon = new L.Icon({
//   iconUrl: "/icons/device-red.svg",
//   iconSize: [28, 28],
//   iconAnchor: [14, 28],
// });

// // ---------- Types ----------
// type GeoPoint = { latitude: number; longitude: number };
// type AssetCurrent = {
//   id?: string; // DB _id or generated
//   asset_id?: string;
//   asset_name?: string;
//   asset_type?: string;
//   location: GeoPoint;
//   timestamp?: string;
//   status?: string;
//   alert?: string | null;
// };
// type AssetHistoryPoint = {
//   id?: string;
//   asset_id?: string;
//   location: GeoPoint;
//   timestamp?: string;
// };

// // ---------- Helper: smooth move marker ----------
// function animateMarkerPosition(marker: LeafletMarker, from: L.LatLng, to: L.LatLng, duration = 700) {
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

// // ---------- Hook component to move map when center changes ----------
// function SetView({ center, zoom }: { center: LatLngExpression | null; zoom?: number }) {
//   const map = useMap();
//   useEffect(() => {
//     if (!center) return;
//     map.setView(center, typeof zoom === "number" ? zoom : map.getZoom(), {
//       animate: true,
//       duration: 0.8,
//     });
//   }, [center, zoom, map]);
//   return null;
// }

// // ---------- MAIN ----------
// export default function MapPage() {
//   const [assets, setAssets] = useState<AssetCurrent[]>([]);
//   const [devices, setDevices] = useState<any[]>([]); // optional devices
//   const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
//   const [route, setRoute] = useState<LatLngExpression[] | null>(null);
//   const [center, setCenter] = useState<LatLngExpression | null>(DEFAULT_CENTER);
//   const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
//   const [filterType, setFilterType] = useState<string>("all");
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [alertsOnly, setAlertsOnly] = useState<boolean>(false);

//   // Geofence UI state
//   const [geofences, setGeofences] = useState<
//     { id: string; type: "circle" | "polygon"; center?: GeoPoint; radius?: number; coords?: LatLngExpression[] }[]
//   >([]);
//   const drawingPolygonRef = useRef<LatLngExpression[]>([]);

//   // Marker cluster group & marker refs
//   const mapRef = useRef<L.Map | null>(null);
//   const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
//   const markersRef = useRef<Record<string, L.Marker>>({}); // key: "asset-<asset_id>" or "device-<device_id>"

//   // Polling ref
//   const pollRef = useRef<number | null>(null);

//   // ---------- INIT map + cluster ----------
//   useEffect(() => {
//     if (mapRef.current) return; // already created by MapContainer
//     // mapRef will be set by MapContainer via onload below (we rely on mapInstance from useEffect when mounted)
//   }, []);

//   // ---------- fetch assets current ----------
//   const fetchCurrent = useCallback(async () => {
//     try {
//       const res = await axios.get(`${API}/assets/current`);
//       const data = Array.isArray(res.data) ? res.data : res.data.items ?? [];
//       // normalize to AssetCurrent
//       const normalized: AssetCurrent[] = data.map((d: any) => {
//         const asset_id = d.asset_id ?? d.assetId ?? d.asset?.asset_id;
//         const lat = d.location?.latitude ?? d.location?.lat ?? d.latitude ?? d.lat;
//         const lng = d.location?.longitude ?? d.location?.lng ?? d.longitude ?? d.lng;
//         return {
//           id: d.id ?? d._id ?? asset_id ?? String(Math.random()),
//           asset_id,
//           asset_name: d.asset_name ?? d.asset_name ?? d.name,
//           asset_type: d.asset_type ?? d.type,
//           location: { latitude: Number(lat), longitude: Number(lng) },
//           timestamp: d.timestamp ?? d.last_seen,
//           status: d.status,
//           alert: d.alert ?? null,
//         };
//       }).filter(a => !Number.isNaN(a.location.latitude) && !Number.isNaN(a.location.longitude));
//       setAssets(normalized);
//     } catch (err) {
//       console.error("Failed to fetch /assets/current", err);
//     }
//   }, []);

//   // optional devices endpoint — try to load if available
//   const fetchDevices = useCallback(async () => {
//     try {
//       const res = await axios.get(`${API}/devices/current`);
//       if (res.data) setDevices(res.data);
//     } catch {
//       // ignore if endpoint missing
//     }
//   }, []);

//   // ---------- update markers in cluster ----------
//   const updateMarkers = useCallback(() => {
//     if (!mapRef.current) return;
//     if (!clusterRef.current) {
//       clusterRef.current = (L as any).markerClusterGroup();
//       clusterRef.current.addTo(mapRef.current);
//     }
//     const cluster = clusterRef.current;

//     // remove markers not present in current lists
//     const keepKeys: Set<string> = new Set();

//     // --- assets ---
//     assets.forEach((a) => {
//       const key = `asset-${a.asset_id ?? a.id}`;
//       keepKeys.add(key);
//       const latLng: L.LatLng = L.latLng(a.location.latitude, a.location.longitude);
//       const existing = markersRef.current[key];
//       if (existing) {
//         // animate movement
//         const from = existing.getLatLng();
//         if (from.equals(latLng) === false) {
//           animateMarkerPosition(existing as any, from, latLng, 700);
//         }
//         // update popup content if needed
//         existing.setPopupContent(popupHtmlForAsset(a));
//         // change icon if selected
//         if (selectedAssetId && selectedAssetId === a.id) {
//           existing.setIcon(activeIcon);
//         } else {
//           existing.setIcon(assetIcon);
//         }
//       } else {
//         const m = L.marker(latLng, { icon: assetIcon });
//         m.bindPopup(popupHtmlForAsset(a));
//         m.on("click", () => {
//           onSelectAsset(a);
//         });
//         markersRef.current[key] = m;
//         cluster.addLayer(m);
//       }
//     });

//     // --- devices (if any) ---
//     devices.forEach((d: any) => {
//       const key = `device-${d.device_id ?? d.id}`;
//       keepKeys.add(key);
//       const lat = d.location?.latitude ?? d.lat ?? d.latitude;
//       const lng = d.location?.longitude ?? d.lng ?? d.longitude;
//       if (!lat || !lng) return;
//       const latLng = L.latLng(Number(lat), Number(lng));
//       const existing = markersRef.current[key];
//       if (existing) {
//         const from = existing.getLatLng();
//         if (from.equals(latLng) === false) animateMarkerPosition(existing as any, from, latLng, 700);
//         existing.setPopupContent(popupHtmlForDevice(d));
//       } else {
//         const m = L.marker(latLng, { icon: deviceIcon as any });
//         m.bindPopup(popupHtmlForDevice(d));
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
//   }, [assets, devices, selectedAssetId]);

//   // popup helpers
//   function popupHtmlForAsset(a: AssetCurrent) {
//     return `
//       <div style="min-width:180px">
//         <div style="font-weight:600">${a.asset_name ?? a.asset_id ?? "Asset"}</div>
//         <div style="font-size:12px;color:#444">ID: ${a.asset_id ?? a.id}</div>
//         <div style="font-size:12px;color:#444">Type: ${a.asset_type ?? "n/a"}</div>
//         <div style="font-size:12px;color:#444">Status: ${a.status ?? "-"}</div>
//         <div style="font-size:12px;color:${a.alert ? "crimson" : "#666"}">${a.alert ? "⚠️ " + a.alert : ""}</div>
//       </div>
//     `;
//   }
//   function popupHtmlForDevice(d: any) {
//     return `
//       <div style="min-width:160px">
//         <div style="font-weight:600">${d.device_name ?? d.device_id ?? "Device"}</div>
//         <div style="font-size:12px;color:#444">ID: ${d.device_id ?? d.id}</div>
//       </div>
//     `;
//   }

//   // ---------- select asset -> load history & fly to ----------
//   async function onSelectAsset(a: AssetCurrent) {
//     setSelectedAssetId(a.id ?? a.asset_id ?? null);
//     setCenter([a.location.latitude, a.location.longitude]);
//     setZoom(15);

//     // fetch history from backend
//     try {
//       // our backend endpoint expects asset_id param as path; use asset_id or id
//       const identifier = encodeURIComponent(a.asset_id ?? a.id ?? "");
//       const res = await axios.get(`${API}/assets/${identifier}/history?days=7`);
//       const pts: LatLngExpression[] = (Array.isArray(res.data) ? res.data : []).map((p: any) => {
//         const lat = p.location?.latitude ?? p.latitude ?? p.lat;
//         const lng = p.location?.longitude ?? p.longitude ?? p.lng;
//         return [Number(lat), Number(lng)];
//       }).filter((pt: any) => !Number.isNaN(pt[0]) && !Number.isNaN(pt[1]));
//       setRoute(pts.length > 0 ? pts : null);
//     } catch (err) {
//       console.warn("Failed to get history:", err);
//       setRoute(null);
//     }
//   }

//   // ---------- polling ----------
//   useEffect(() => {
//     // initial load
//     (async () => {
//       await fetchCurrent();
//       await fetchDevices();
//     })();

//     // start polling
//     pollRef.current = window.setInterval(async () => {
//       await fetchCurrent();
//       await fetchDevices();
//     }, POLL_INTERVAL_MS);

//     return () => {
//       if (pollRef.current) clearInterval(pollRef.current);
//     };
//   }, [fetchCurrent, fetchDevices]);

//   // apply cluster updates whenever assets/devices change
//   useEffect(() => {
//     updateMarkers();
//   }, [assets, devices, updateMarkers]);

//   // ---------- search & filters ----------
//   const filteredAssets = assets.filter((a) => {
//     if (alertsOnly && !a.alert) return false;
//     if (filterType !== "all" && a.asset_type !== filterType) return false;
//     if (!searchTerm) return true;
//     const s = searchTerm.toLowerCase();
//     return (a.asset_id ?? "").toLowerCase().includes(s) || (a.asset_name ?? "").toLowerCase().includes(s);
//   });

//   // debounce search to reduce renders (optional)
//   const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//   };
//   const debouncedSearch = debounce(onSearchChange, 150);

//   // ---------- map ready callback ----------
//   const onMapCreated = (mapInstance: L.Map) => {
//     mapRef.current = mapInstance;
//     // ensure cluster exists
//     if (!clusterRef.current) {
//       clusterRef.current = (L as any).markerClusterGroup();
//       clusterRef.current.addTo(mapInstance);
//     }
//     // add click handlers for polygon drawing (if user is drawing)
//     mapInstance.on("click", (ev: any) => {
//       if (drawingPolygonRef.current.length > 0) {
//         drawingPolygonRef.current.push([ev.latlng.lat, ev.latlng.lng]);
//         // optional visual temporary polyline: create & remove each click
//         // user completes polygon with "Finish Polygon" button below
//       }
//     });
//   };

//   // ---------- Geofence controls (simple manual tools) ----------
//   function addCircleGeofence() {
//     // create circle from center and radius prompt
//     const center = prompt("Enter center as lat,lng (e.g. 12.97,77.59)");
//     if (!center) return;
//     const [latStr, lngStr] = center.split(",").map((s) => s.trim());
//     const lat = Number(latStr);
//     const lng = Number(lngStr);
//     const radius = Number(prompt("Enter radius in meters", "500") || "500");
//     if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius)) {
//       alert("Invalid input");
//       return;
//     }
//     const gf = { id: String(Date.now()), type: "circle", center: { latitude: lat, longitude: lng }, radius };
//     setGeofences((s) => [...s, gf]);
//   }

//   function startPolygonDrawing() {
//     drawingPolygonRef.current = [];
//     alert("Polygon drawing started. Click on the map to add points. Then click 'Finish Polygon'.");
//   }

//   function finishPolygonDrawing() {
//     if (drawingPolygonRef.current.length < 3) {
//       alert("Need at least 3 points to make a polygon.");
//       drawingPolygonRef.current = [];
//       return;
//     }
//     const coords = [...drawingPolygonRef.current];
//     const gf = { id: String(Date.now()), type: "polygon", coords };
//     setGeofences((s) => [...s, gf]);
//     drawingPolygonRef.current = [];
//   }

//   // ---------- highlight active asset in marker cluster / sidebar ----------
//   useEffect(() => {
//     // change icon of previously selected markers
//     Object.entries(markersRef.current).forEach(([key, m]) => {
//       if (selectedAssetId && key === `asset-${selectedAssetId}`) {
//         m.setIcon(activeIcon);
//         // open popup and fly to
//         m.openPopup();
//         const latlng = m.getLatLng();
//         setCenter([latlng.lat, latlng.lng]);
//         setZoom(15);
//       } else if (key.startsWith("asset-")) {
//         m.setIcon(assetIcon);
//       }
//     });
//   }, [selectedAssetId]);

//   // ---------- utility: jump to asset by id ----------
//   const jumpToAsset = async (assetId: string) => {
//     const found = assets.find((a) => (a.asset_id ?? a.id) === assetId || a.id === assetId);
//     if (found) {
//       onSelectAsset(found);
//       return;
//     }
//     // fallback: try to fetch single asset endpoint if you have /assets/by-asset/{asset_id}
//     try {
//       const res = await axios.get(`${API}/assets/by-asset/${encodeURIComponent(assetId)}`);
//       if (res.data) {
//         const a = res.data;
//         // convert shape -> AssetCurrent
//         const lat = a.registered_location?.latitude ?? a.registered_location?.lat;
//         const lng = a.registered_location?.longitude ?? a.registered_location?.lng;
//         if (lat && lng) {
//           onSelectAsset({
//             id: a.id ?? a._id ?? a.asset_id,
//             asset_id: a.asset_id,
//             asset_name: a.asset_name,
//             asset_type: a.asset_type,
//             location: { latitude: Number(lat), longitude: Number(lng) },
//             timestamp: a.updated_at,
//           } as AssetCurrent);
//         }
//       }
//     } catch (err) {
//       console.warn("Jump fetch failed:", err);
//       alert("Asset not found locally or via API.");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="w-full h-screen flex">
//       {/* Sidebar */}
//       <aside className="w-80 bg-white border-r p-3 overflow-y-auto">
//         <h2 className="text-lg font-semibold mb-2">Assets</h2>

//         <div className="mb-2">
//           <input
//             type="text"
//             placeholder="Search by asset id or name..."
//             onChange={(e) => debouncedSearch(e)}
//             className="w-full p-2 border rounded"
//             defaultValue={searchTerm}
//           />
//           <div className="flex gap-2 mt-2">
//             <button
//               onClick={() => { debouncedSearch.cancel?.(); setSearchTerm(""); (document.querySelector('input') as HTMLInputElement | null)?.focus(); fetchCurrent(); }}
//               className="px-2 py-1 bg-gray-100 rounded"
//             >
//               Reset
//             </button>
//             <button
//               onClick={() => { if ((document.querySelector('input') as HTMLInputElement)) jumpToAsset((document.querySelector('input') as HTMLInputElement).value); }}
//               className="px-2 py-1 bg-blue-600 text-white rounded"
//             >
//               Jump
//             </button>
//           </div>
//         </div>

//         <div className="mb-2">
//           <label className="text-sm">Filter by type</label>
//           <select className="w-full p-2 border rounded" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//             <option value="all">All</option>
//             <option value="vehicle">vehicle</option>
//             <option value="machine">machine</option>
//             <option value="person">person</option>
//           </select>
//         </div>

//         <div className="mb-2 flex items-center gap-2">
//           <input id="alerts-only" type="checkbox" checked={alertsOnly} onChange={(e)=> setAlertsOnly(e.target.checked)} />
//           <label htmlFor="alerts-only" className="text-sm">Show alerts only</label>
//         </div>

//         <div className="mb-3 flex flex-col gap-2">
//           <button onClick={()=>setAssets([])} className="text-sm p-2 bg-gray-100 rounded">Clear list (dev)</button>
//           <button onClick={()=>addCircleGeofence()} className="text-sm p-2 bg-purple-600 text-white rounded">Add Circle Geofence</button>
//           <button onClick={()=>startPolygonDrawing()} className="text-sm p-2 bg-indigo-600 text-white rounded">Start Polygon Draw</button>
//           <button onClick={()=>finishPolygonDrawing()} className="text-sm p-2 bg-indigo-800 text-white rounded">Finish Polygon</button>
//         </div>

//         <div>
//           {filteredAssets.length === 0 && <div className="text-sm text-gray-500">No assets found.</div>}
//           {filteredAssets.map((a) => {
//             const key = a.asset_id ?? a.id;
//             const isSelected = selectedAssetId === (a.id ?? a.asset_id);
//             const online = !a.timestamp || (Date.now() - new Date(a.timestamp).getTime()) < 2*60*1000;
//             return (
//               <div key={key} className={`p-2 border rounded mb-2 cursor-pointer ${isSelected ? "bg-blue-50" : "bg-white"}`} onClick={()=>onSelectAsset(a)}>
//                 <div className="flex justify-between">
//                   <div>
//                     <div className="font-semibold">{a.asset_name ?? a.asset_id ?? key}</div>
//                     <div className="text-xs text-gray-600">{a.asset_type ?? "type unknown"}</div>
//                     <div className="text-xs text-gray-500">{a.status ?? ""}</div>
//                     {a.alert && <div className="text-xs text-red-600 font-bold">⚠️ {a.alert}</div>}
//                   </div>
//                   <div className="text-right">
//                     <div className={`text-sm ${online ? "text-green-600" : "text-gray-400"}`}>{online ? "online" : "offline"}</div>
//                     <div className="text-xs text-gray-400">{a.location.latitude.toFixed(4)}, {a.location.longitude.toFixed(4)}</div>
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
//           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
//           {/* route polyline */}
//           {route && route.length > 1 && <Polyline positions={route as LatLngExpression[]} pathOptions={{ color: "#1d4ed8", weight: 4 }} />}
//           {/* geofences */}
//           {geofences.map((g) => (
//             g.type === "circle" && g.center ? (
//               <Circle key={g.id} center={[g.center.latitude, g.center.longitude]} radius={g.radius as number} pathOptions={{ color: "purple", fillOpacity: 0.08 }} />
//             ) : g.type === "polygon" && g.coords ? (
//               <Polygon key={g.id} positions={g.coords} pathOptions={{ color: "green", fillOpacity: 0.06 }} />
//             ) : null
//           ))}
//         </MapContainer>
//       </main>
//     </div>
//   );
// }



// // import { useEffect, useState, useRef } from "react";
// // import L from "leaflet";
// // import "leaflet/dist/leaflet.css";
// // import { useAuth } from "../contexts/AuthContext";
// // import axios from "axios";

// // // Fix default marker icons
// // delete (L.Icon.Default.prototype as any)._getIconUrl;
// // L.Icon.Default.mergeOptions({
// //   iconRetinaUrl: "/leaflet/marker-icon-2x.png",
// //   iconUrl: "/leaflet/marker-icon.png",
// //   shadowUrl: "/leaflet/marker-shadow.png",
// // });

// // interface LocationPoint {
// //   latitude: number;
// //   longitude: number;
// // }

// // interface AssetLocation {
// //   asset_id: string;
// //   asset_name: string;
// //   location: LocationPoint;
// //   timestamp: string;
// // }

// // interface DeviceLocation {
// //   device_id: string;
// //   device_name: string;
// //   location: LocationPoint;
// //   timestamp: string;
// // }

// // export default function MapPage() {
// //   const { token } = useAuth();
// //   const mapRef = useRef<L.Map | null>(null);
// //   const markersRef = useRef<{ [key: string]: L.Marker }>({});
// //   const [assetSearch, setAssetSearch] = useState("");

// //   const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// //   // Initialize Map
// //   useEffect(() => {
// //     if (!mapRef.current) {
// //       mapRef.current = L.map("map", {
// //         center: [12.9716, 77.5946], // Bangalore
// //         zoom: 12,
// //       });

// //       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// //         maxZoom: 19,
// //         attribution: "© OpenStreetMap contributors",
// //       }).addTo(mapRef.current);
// //     }
// //   }, []);

// //   // Fetch & Update Marker (Assets + Devices)
// //   const loadLiveLocations = async () => {
// //     try {
// //       const headers = { Authorization: `Bearer ${token}` };

// //       const [assetsRes, devicesRes] = await Promise.all([
// //         axios.get(`${API}/locations/assets/current`, { headers }),
// //         axios.get(`${API}/locations/devices/current`, { headers }),
// //       ]);

// //       const assets: AssetLocation[] = assetsRes.data;
// //       const devices: DeviceLocation[] = devicesRes.data;

// //       updateMarkers(assets, devices);
// //     } catch (error) {
// //       console.error("Live tracking error:", error);
// //     }
// //   };

// //   // Update marker positions
// //   const updateMarkers = (
// //     assets: AssetLocation[],
// //     devices: DeviceLocation[]
// //   ) => {
// //     const map = mapRef.current;
// //     if (!map) return;

// //     // -------------------
// //     // 📌 Add ASSET Markers
// //     // -------------------
// //     assets.forEach((a) => {
// //       const key = `asset-${a.asset_id}`;

// //       if (!markersRef.current[key]) {
// //         // Create new marker
// //         markersRef.current[key] = L.marker([a.location.latitude, a.location.longitude], {
// //           title: `${a.asset_name}`,
// //         }).addTo(map);
// //       } else {
// //         // Update marker position
// //         markersRef.current[key].setLatLng([
// //           a.location.latitude,
// //           a.location.longitude,
// //         ]);
// //       }
// //     });

// //     // --------------------
// //     // 📌 Add DEVICE Markers
// //     // --------------------
// //     devices.forEach((d) => {
// //       const key = `device-${d.device_id}`;

// //       if (!markersRef.current[key]) {
// //         markersRef.current[key] = L.circleMarker(
// //           [d.location.latitude, d.location.longitude],
// //           {
// //             radius: 8,
// //             color: "red",
// //             fillColor: "red",
// //             fillOpacity: 0.8,
// //           }
// //         )
// //           .bindPopup(`Device: ${d.device_id}`)
// //           .addTo(map);
// //       } else {
// //         markersRef.current[key].setLatLng([
// //           d.location.latitude,
// //           d.location.longitude,
// //         ]);
// //       }
// //     });
// //   };

// //   // Auto refresh every 5 sec
// //   useEffect(() => {
// //     loadLiveLocations(); // first load
// //     const interval = setInterval(loadLiveLocations, 5000);
// //     return () => clearInterval(interval);
// //   }, []);

// //   // Search asset ID and highlight
// //   const handleAssetSearch = async (e: React.FormEvent) => {
// //     e.preventDefault();

// //     if (!assetSearch.trim()) return;

// //     const headers = { Authorization: `Bearer ${token}` };

// //     try {
// //       const res = await axios.get(
// //         `${API}/locations/assets/${assetSearch}/history?days=1`,
// //         { headers }
// //       );

// //       if (res.data.length === 0) {
// //         alert("Asset not found or no location available");
// //         return;
// //       }

// //       const latest = res.data[0];
// //       const lat = latest.location.latitude;
// //       const lng = latest.location.longitude;

// //       mapRef.current?.setView([lat, lng], 15);

// //       const key = `asset-${assetSearch}`;

// //       // Highlight with animation
// //       markersRef.current[key]?.bindPopup(`<b>Selected Asset</b>`).openPopup();
// //     } catch (error) {
// //       console.error(error);
// //       alert("Invalid Asset ID");
// //     }
// //   };

// //   return (
// //     <div className="w-full h-screen flex flex-col">
// //       {/* Search Bar */}
// //       <form
// //         onSubmit={handleAssetSearch}
// //         className="p-3 bg-white shadow flex gap-2 items-center"
// //       >
// //         <input
// //           type="text"
// //           placeholder="Search Asset ID..."
// //           value={assetSearch}
// //           onChange={(e) => setAssetSearch(e.target.value)}
// //           className="border p-2 rounded w-60"
// //         />
// //         <button className="bg-blue-600 text-white px-4 py-2 rounded">
// //           Search
// //         </button>
// //       </form>

// //       {/* MAP */}
// //       <div id="map" className="flex-1" />
// //     </div>
// //   );
// // }


// // import React, { useEffect, useRef, useState } from "react";
// // import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
// // import L from "leaflet";
// // import "leaflet/dist/leaflet.css";
// // import axios from "axios";        // if you need axios in the component
// // import mqtt from "mqtt";          // static import works with Vite

// // // If you use an icon bundle or local icons, adjust these imports
// // import iconUrl from "leaflet/dist/images/marker-icon.png";
// // import iconShadow from "leaflet/dist/images/marker-shadow.png";

// // // MQTT (mqtt over websockets)
// // // npm install mqtt
// // let mqttClient = null;

// // // Fix default marker icons for many bundlers
// // const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
// // L.Marker.prototype.options.icon = DefaultIcon;

// // // Small helper to fly map to a position when selected
// // function FlyTo({ position }) {
// //   const map = useMap();
// //   useEffect(() => {
// //     if (position) map.flyTo(position, 14);
// //   }, [position, map]);
// //   return null;
// // }

// // export default function MapPage({
// //   wsUrl = `${import.meta.env.VITE_API_BASE_URL?.replace(/http/, "ws")}/ws/locations`,
// //   mqttWsUrl = import.meta.env.VITE_MQTT_WS_URL || "wss://broker.hivemq.com:8000/mqtt",
// //   pollingInterval = 10000,
// //   initialCenter = [20.5937, 78.9629],
// // }) {
// //   const [assets, setAssets] = useState({}); // keyed by asset_id
// //   const [filterType, setFilterType] = useState("all");
// //   const [filterStatus, setFilterStatus] = useState("all");
// //   const [selectedAssetId, setSelectedAssetId] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [coordinateInput, setCoordinateInput] = useState("");
// //   const wsRef = useRef(null);
// //   const pollingRef = useRef(null);

// //   // CSS for blinking marker (insert to document head once)
// //   useEffect(() => {
// //     const styleId = "leaflet-blink-style";
// //     if (!document.getElementById(styleId)) {
// //       const style = document.createElement("style");
// //       style.id = styleId;
// //       style.innerHTML = `
// //         .blink-marker .leaflet-marker-icon {
// //           animation: blink-pulse 1s infinite;
// //         }
// //         @keyframes blink-pulse {
// //           0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(255,0,0,0)); }
// //           50% { transform: scale(1.15); filter: drop-shadow(0 0 6px rgba(255,0,0,0.9)); }
// //           100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(255,0,0,0)); }
// //         }
// //       `;
// //       document.head.appendChild(style);
// //     }
// //   }, []);

// //   // Fetch initial assets (registered locations or latest locations)
// //   const fetchInitialAssets = async () => {
// //     setLoading(true);
// //     try {
// //       const token = localStorage.getItem("token");
// //       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/locations/assets/current`, {
// //         headers: token ? { Authorization: `Bearer ${token}` } : {},
// //       });
// //       const data = await res.json();
// //       // data expected as list of { asset_id, asset_name, location: { latitude, longitude }, ... }
// //       const map = {};
// //       if (Array.isArray(data)) {
// //         for (const a of data) {
// //           const id = a.asset_id || a.assetId || a.asset_id || a.id;
// //           const loc = a.location || a.current_location || a.location || {};
// //           map[id] = {
// //             asset_id: id,
// //             name: a.asset_name || a.asset_name || a.name || id,
// //             type: a.asset_type || a.type || "unknown",
// //             status: a.status || "active",
// //             latitude: Number(loc.latitude) || Number(a.latitude) || null,
// //             longitude: Number(loc.longitude) || Number(a.longitude) || null,
// //             updated_at: a.timestamp || a.updated_at || new Date().toISOString(),
// //             alert: a.alert || false,
// //           };
// //         }
// //       }
// //       setAssets(map);
// //     } catch (e) {
// //       console.error("Failed to fetch assets:", e);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // WebSocket real-time connection (Option A)
// //   useEffect(() => {
// //     try {
// //       const ws = new WebSocket(wsUrl);
// //       wsRef.current = ws;

// //       ws.onopen = () => {
// //         console.info("WS connected", wsUrl);
// //       };

// //       ws.onmessage = (ev) => {
// //         try {
// //           const payload = JSON.parse(ev.data);
// //           // Expect payload to be something like: { type: 'location', asset_id, latitude, longitude, alert }
// //           if (payload && payload.asset_id) {
// //             setAssets((prev) => ({
// //               ...prev,
// //               [payload.asset_id]: {
// //                 ...(prev[payload.asset_id] || {}),
// //                 asset_id: payload.asset_id,
// //                 name: payload.asset_name || (prev[payload.asset_id] && prev[payload.asset_id].name) || payload.asset_id,
// //                 type: payload.asset_type || (prev[payload.asset_id] && prev[payload.asset_id].type) || "unknown",
// //                 latitude: payload.latitude,
// //                 longitude: payload.longitude,
// //                 updated_at: payload.timestamp || new Date().toISOString(),
// //                 alert: !!payload.alert,
// //                 status: payload.status || (prev[payload.asset_id] && prev[payload.asset_id].status) || "active",
// //               }
// //             }));
// //           }
// //         } catch (e) {
// //           console.error("WS parse error", e);
// //         }
// //       };

// //       ws.onerror = (err) => console.error("WS error", err);
// //       ws.onclose = () => console.info("WS closed");

// //       return () => {
// //         ws.close();
// //       };
// //     } catch (e) {
// //       console.error("WS init failed", e);
// //     }
// //   }, [wsUrl]);

// //   // MQTT over WebSocket (Option B)
// //  useEffect(() => {
// //   let client: any = null;

// //   try {
// //     // connect; mqtt will use browser WebSocket automatically when ws URL provided
// //     client = mqtt.connect(mqttWsUrl, {
// //       reconnectPeriod: 5000,
// //       // optional: clientId: `web_${Math.random().toString(16).substr(2,8)}`,
// //     });

// //     client.on("connect", () => {
// //       console.info("MQTT connected to", mqttWsUrl);
// //       // subscribe to topic(s) you use; adjust topic as needed
// //       client.subscribe("my/devices/#", (err: any) => {
// //         if (err) console.error("MQTT subscribe error", err);
// //       });
// //     });

// //     client.on("message", (_topic: any, message: Buffer) => {
// //       try {
// //         const payload = JSON.parse(message.toString());
// //         // handle payload: expect { asset_id, latitude, longitude, alert, ... }
// //         const id = payload.asset_id || payload.device_id;
// //         if (!id) return;
// //         setAssets((prev) => ({
// //           ...prev,
// //           [id]: {
// //             ...(prev[id] || {}),
// //             asset_id: id,
// //             name: payload.asset_name || prev[id]?.name || id,
// //             latitude: payload.latitude,
// //             longitude: payload.longitude,
// //             updated_at: payload.timestamp || new Date().toISOString(),
// //             alert: !!payload.alert,
// //             status: payload.status || prev[id]?.status || "active",
// //           },
// //         }));
// //       } catch (e) {
// //         console.error("MQTT message parse error", e);
// //       }
// //     });

// //     client.on("error", (err: any) => console.error("MQTT error:", err));
// //   } catch (e) {
// //     console.error("Failed to init MQTT:", e);
// //   }

// //   return () => {
// //     try {
// //       if (client) client.end(true);
// //     } catch (e) {}
// //   };
// // }, [mqttWsUrl]);


// //   // Polling fallback (Option C)
// //   useEffect(() => {
// //     fetchInitialAssets();
// //     pollingRef.current = setInterval(fetchInitialAssets, pollingInterval);
// //     return () => clearInterval(pollingRef.current);
// //   }, []);

// //   // Derived list based on filters
// //   const visibleAssets = Object.values(assets).filter((a) => {
// //     if (!a.latitude || !a.longitude) return false;
// //     if (filterType !== "all" && a.type !== filterType) return false;
// //     if (filterStatus !== "all" && a.status !== filterStatus) return false;
// //     return true;
// //   });

// //   const handleCoordinateLocate = () => {
// //     const parts = coordinateInput.split(",").map((s) => s.trim());
// //     if (parts.length >= 2) {
// //       const lat = parseFloat(parts[0]);
// //       const lng = parseFloat(parts[1]);
// //       if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
// //         // create a temp marker
// //         const tempId = `coord-${lat}-${lng}`;
// //         setAssets((prev) => ({
// //           ...prev,
// //           [tempId]: {
// //             asset_id: tempId,
// //             name: `Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
// //             type: "coord",
// //             latitude: lat,
// //             longitude: lng,
// //             updated_at: new Date().toISOString(),
// //             alert: false,
// //           }
// //         }));
// //         setSelectedAssetId(tempId);
// //       }
// //     }
// //   };

// //   const onSelectAsset = (asset_id) => {
// //     setSelectedAssetId(asset_id);
// //   };

// //   return (
// //     <div className="flex h-screen w-full">
// //       {/* Sidebar */}
// //       <aside className="w-80 p-4 border-r overflow-auto bg-white">
// //         <h2 className="text-lg font-semibold mb-2">Assets</h2>

// //         <div className="mb-3">
// //           <input
// //             placeholder="Lat,Lng"
// //             value={coordinateInput}
// //             onChange={(e) => setCoordinateInput(e.target.value)}
// //             className="w-full border rounded px-2 py-1 mb-2"
// //           />
// //           <button onClick={handleCoordinateLocate} className="w-full bg-green-600 text-white py-1 rounded">Locate</button>
// //         </div>

// //         <div className="mb-3">
// //           <label className="block text-sm font-medium">Type</label>
// //           <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full border rounded px-2 py-1">
// //             <option value="all">All</option>
// //             <option value="Vehicle">Vehicle</option>
// //             <option value="Container">Container</option>
// //             <option value="Equipment">Equipment</option>
// //             <option value="coord">Coordinates</option>
// //           </select>
// //         </div>

// //         <div className="mb-3">
// //           <label className="block text-sm font-medium">Status</label>
// //           <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded px-2 py-1">
// //             <option value="all">All</option>
// //             <option value="active">Active</option>
// //             <option value="inactive">Inactive</option>
// //           </select>
// //         </div>

// //         <div className="space-y-2">
// //           {visibleAssets.map((a) => (
// //             <div key={a.asset_id} className={`p-2 rounded border cursor-pointer ${selectedAssetId === a.asset_id ? "bg-blue-50" : "bg-white"}`} onClick={() => onSelectAsset(a.asset_id)}>
// //               <div className="flex justify-between items-center">
// //                 <div>
// //                   <div className="font-medium">{a.name}</div>
// //                   <div className="text-xs text-gray-500">{a.asset_id}</div>
// //                 </div>
// //                 <div className="text-right">
// //                   <div className="text-sm">{a.type}</div>
// //                   <div className="text-xs text-gray-500">{new Date(a.updated_at).toLocaleString()}</div>
// //                 </div>
// //               </div>
// //               {a.alert && <div className="text-red-600 text-sm mt-1">Alert active</div>}
// //             </div>
// //           ))}
// //         </div>
// //       </aside>

// //       {/* Map */}
// //       <main className="flex-1 relative">
// //         <div className="absolute top-4 left-4 z-50 bg-white p-2 rounded shadow">
// //           <div className="flex gap-2">
// //             <input
// //               placeholder="Search asset id"
// //               onKeyDown={(e) => { if (e.key === "Enter") setSelectedAssetId(e.target.value); }}
// //               className="border px-2 py-1 rounded"
// //             />
// //             <button onClick={() => { /* could trigger search */ }} className="px-3 py-1 bg-blue-600 text-white rounded">Search</button>
// //           </div>
// //         </div>

// //         <MapContainer center={initialCenter} zoom={5} style={{ height: "100%", width: "100%" }}>
// //           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

// //           {Object.values(assets).filter(a => a.latitude && a.longitude).map((a) => {
// //             const pos = [a.latitude, a.longitude];
// //             const isSelected = selectedAssetId === a.asset_id;
// //             const markerClass = a.alert ? "blink-marker" : "";
// //             const icon = DefaultIcon;

// //             return (
// //               <Marker key={a.asset_id} position={pos} icon={icon} eventHandlers={{ click: () => setSelectedAssetId(a.asset_id) }}>
// //                 <Popup>
// //                   <div className="space-y-1">
// //                     <div className="font-semibold">{a.name}</div>
// //                     <div className="text-xs text-gray-600">{a.asset_id}</div>
// //                     <div className="text-xs">Type: {a.type}</div>
// //                     <div className="text-xs">Status: {a.status}</div>
// //                     <div className="text-xs">Updated: {new Date(a.updated_at).toLocaleString()}</div>
// //                     {a.alert && <div className="text-red-600 font-semibold">ALERT ACTIVE</div>}
// //                   </div>
// //                 </Popup>
// //               </Marker>
// //             );
// //           })}

// //           {/* Fly to selected asset */}
// //           {selectedAssetId && assets[selectedAssetId] && (
// //             <FlyTo position={[assets[selectedAssetId].latitude, assets[selectedAssetId].longitude]} />
// //           )}

// //           {/* Draw geofences if your API provides them (example) */}
// //           {/* <Circle center={[lat, lng]} radius={100} /> */}
// //         </MapContainer>
// //       </main>
// //     </div>
// //   );
// // }

// // // src/pages/MapPage.tsx
// // import { useEffect, useMemo, useRef, useState } from "react";
// // import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
// // import L from "leaflet";
// // import "leaflet/dist/leaflet.css";
// // import { apiClient } from "../Services/api";
// // import type { AssetWithDevices, LinkedDeviceInfo } from "../types";
// // import axios from "axios";

// // // Fix Leaflet's default icon (important for Vite builds)
// // delete (L.Icon.Default as any).prototype._getIconUrl;
// // L.Icon.Default.mergeOptions({
// //   iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
// //   iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
// //   shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
// // });

// // const BANGALORE = { lat: 12.9716, lon: 77.5946 };
// // const POLLING_INTERVAL_MS = 5000; // 5 seconds

// // function FlyToLocation({ lat, lon, zoom }: { lat: number; lon: number; zoom?: number }) {
// //   const map = useMap();
// //   useEffect(() => {
// //     if (lat != null && lon != null) {
// //       map.flyTo([lat, lon], zoom ?? map.getZoom(), { duration: 0.8 });
// //     }
// //   }, [lat, lon, zoom, map]);
// //   return null;
// // }

// // function getDeviceCoordinates(d: LinkedDeviceInfo): { lat?: number; lon?: number; when?: string } {
// //   // Try multiple shapes
// //   if ((d as any).last_location && (d as any).last_location.lat != null) {
// //     return { lat: (d as any).last_location.lat, lon: (d as any).last_location.lon, when: (d as any).last_location.timestamp };
// //   }
// //   if ((d as any).location && (d as any).location.latitude != null) {
// //     return { lat: (d as any).location.latitude, lon: (d as any).location.longitude, when: (d as any).location.timestamp };
// //   }
// //   if ((d as any).latitude != null && (d as any).longitude != null) {
// //     return { lat: (d as any).latitude, lon: (d as any).longitude, when: (d as any).time_stamp ?? (d as any).timeStamp };
// //   }
// //   // fallback
// //   return { };
// // }

