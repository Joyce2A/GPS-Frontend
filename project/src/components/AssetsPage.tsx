// src/pages/AssetsPage.tsx

import { useState, useEffect } from "react";
import {
  Plus,
  Package,
  MapPin,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
} from "lucide-react";
import { AddAssetModal } from "../components/AddAssetModal";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ----------------------------------------------------------------------
// FIXED INTERFACE
// ----------------------------------------------------------------------
interface Asset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  description?: string;
  registered_location: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  created_at?: string;
}

export function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const res = await axios.get(`${API_BASE_URL}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAssets(res.data);
      setFilteredAssets(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || err.message || "Failed to fetch assets"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      await axios.delete(`${API_BASE_URL}/assets/by-asset/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchAssets();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete asset");
    }
  };

  const handleSearch = (term: string) => {
    const txt = term.trim();
    setSearchTerm(txt);

    if (!txt) {
      setFilteredAssets(assets);
      return;
    }

    setFilteredAssets(
      assets.filter((a) =>
        a.asset_id.toLowerCase().includes(txt.toLowerCase())
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Package className="w-10 h-10 text-green-600" />
              Assets
            </h1>
            <p className="text-gray-600 mt-2">Manage your tracked assets</p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by Asset ID..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />

            <button
              onClick={fetchAssets}
              className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={() => {
                setEditingAsset(null);
                setViewAsset(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No assets found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "No results for this Asset ID"
                : "Get started by adding your first asset"}
            </p>
            <button
              onClick={() => {
                setEditingAsset(null);
                setViewAsset(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg"
            >
              Add Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.asset_id}
                className="bg-white p-6 rounded-xl shadow"
              >
                {/* INFO */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{asset.asset_name}</h3>
                      <p className="text-sm text-gray-500">{asset.asset_id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{asset.asset_type}</span>
                  </div>

                  {asset.description && (
                    <div className="text-sm">
                      <span className="text-gray-600">Description:</span>
                      <p>{asset.description}</p>
                    </div>
                  )}

                  <div className="flex gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-mono text-xs">
                        {asset.registered_location.latitude.toFixed(6)},{" "}
                        {asset.registered_location.longitude.toFixed(6)}{" "}
                        <span className="text-gray-500">
                          (Radius: {asset.registered_location.radius} m)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => {
                      setEditingAsset(asset);
                      setViewAsset(null);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(asset.asset_id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>

                  <button
                    onClick={() => {
                      setEditingAsset(null);
                      setViewAsset(asset);
                      setIsModalOpen(true);
                    }}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      <AddAssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setViewAsset(null);
          setEditingAsset(null);
        }}
        onSuccess={fetchAssets}
        editingAsset={editingAsset}
        viewAsset={viewAsset}
      />
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { Plus, Package, MapPin, Edit, Trash2, RefreshCw, Eye } from "lucide-react";
// import { AddAssetModal } from "../components/AddAssetModal";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: {
//     latitude: number;
//     longitude: number;
//     radius: number;
//   };
//   created_at?: string;
// }

// export function AssetsPage() {
//   const [assets, setAssets] = useState<Asset[]>([]);
//   const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
//   const [viewAsset, setViewAsset] = useState<Asset | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");

//   const fetchAssets = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       const response = await axios.get(`${API_BASE_URL}/assets`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setAssets(response.data);
//       setFilteredAssets(response.data);
//     } catch (err: any) {
//       console.error("Fetch error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to fetch assets");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAssets();
//   }, []);

//   const handleDelete = async (assetId: string) => {
//     if (!confirm("Are you sure you want to delete this asset?")) return;

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       await axios.delete(`${API_BASE_URL}/assets/by-asset/${assetId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       fetchAssets();
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to delete asset");
//     }
//   };

//   const handleSearch = (term: string) => {
//     const trimmed = term.trim();
//     setSearchTerm(trimmed);

//     if (!trimmed) {
//       setFilteredAssets(assets);
//     } else {
//       const filtered = assets.filter((a) =>
//         a.asset_id.toLowerCase().includes(trimmed.toLowerCase())
//       );
//       setFilteredAssets(filtered);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100">
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
//               <Package className="w-10 h-10 text-green-600" />
//               Assets
//             </h1>
//             <p className="text-gray-600 mt-2">Manage your tracked assets</p>
//           </div>

//           {/* Actions */}
//           <div className="flex gap-3 flex-wrap">
//             <input
//               type="text"
//               placeholder="Search by Asset ID..."
//               value={searchTerm}
//               onChange={(e) => handleSearch(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//             <button
//               onClick={fetchAssets}
//               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
//             >
//               <RefreshCw className="w-4 h-4" />
//               Refresh
//             </button>
//             <button
//               onClick={() => {
//                 setEditingAsset(null);
//                 setViewAsset(null);
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-lg"
//             >
//               <Plus className="w-5 h-5" />
//               Add Asset
//             </button>
//           </div>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* Loading */}
//         {loading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
//           </div>
//         ) : filteredAssets.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-lg p-12 text-center">
//             <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-600 mb-2">No assets found</h3>
//             <p className="text-gray-500 mb-6">
//               {searchTerm ? "No results for this Asset ID" : "Get started by adding your first asset"}
//             </p>
//             <button
//               onClick={() => {
//                 setEditingAsset(null);
//                 setViewAsset(null);
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//             >
//               Add Asset
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredAssets.map((asset) => (
//               <div
//                 key={asset.asset_id}
//                 className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6"
//               >
//                 {/* Asset Info */}
//                 <div className="flex justify-between items-start mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-3 bg-green-100 rounded-lg">
//                       <Package className="w-6 h-6 text-green-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800">{asset.asset_name}</h3>
//                       <p className="text-sm text-gray-500">{asset.asset_id}</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-600">Type:</span>
//                     <span className="font-medium text-gray-800">{asset.asset_type}</span>
//                   </div>

//                   {asset.description && (
//                     <div className="text-sm">
//                       <span className="text-gray-600">Description:</span>
//                       <p className="text-gray-800 mt-1">{asset.description}</p>
//                     </div>
//                   )}

//                   <div className="flex items-start gap-2 text-sm pt-2">
//                     <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
//                     <div className="flex-1">
//                       <span className="text-gray-600">Location:</span>
//                       <p className="text-gray-800 font-mono text-xs mt-1">
//                         {asset.registered_location.latitude.toFixed(6)},{" "}
//                         {asset.registered_location.longitude.toFixed(6)}{" "}
//                         <span className="text-gray-500">
//                           (Radius: {asset.registered_location.radius} m)
//                         </span>
//                       </p>
//                     </div>
//                   </div>

//                   {asset.created_at && (
//                     <div className="flex justify-between text-sm pt-2 border-t">
//                       <span className="text-gray-600">Created:</span>
//                       <span className="font-medium text-gray-800">
//                         {new Date(asset.created_at).toLocaleDateString()}
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Actions */}
//                 <div className="flex gap-2 pt-4 border-t">
//                   <button
//                     onClick={() => {
//                       setEditingAsset(asset);
//                       setViewAsset(null);
//                       setIsModalOpen(true);
//                     }}
//                     className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Edit className="w-4 h-4" />
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(asset.asset_id)}
//                     className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                     Delete
//                   </button>
//                   <button
//                     onClick={() => {
//                       setEditingAsset(null);
//                       setViewAsset(asset);
//                       setIsModalOpen(true);
//                     }}
//                     className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Eye className="w-4 h-4" />
//                     View
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       <AddAssetModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditingAsset(null);
//           setViewAsset(null);
//         }}
//         onSuccess={fetchAssets}
//         editingAsset={editingAsset}
//         viewAsset={viewAsset}
//       />
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { Plus, Package, MapPin, Edit, Trash2, RefreshCw } from "lucide-react";
// import { AddAssetModal } from "../components/AddAssetModal";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: {
//     latitude: number;
//     longitude: number;
//   };
//   created_at?: string;
// }

// export function AssetsPage() {
//   const [assets, setAssets] = useState<Asset[]>([]);
//   const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");

//   // Fetch assets from backend
//   const fetchAssets = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       const response = await axios.get(`${API_BASE_URL}/assets`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setAssets(response.data);
//       setFilteredAssets(response.data);
//     } catch (err: any) {
//       console.error("Fetch error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to fetch assets");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAssets();
//   }, []);

//   // Delete asset
//   const handleDelete = async (assetId: string) => {
//     if (!confirm("Are you sure you want to delete this asset?")) return;

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       await axios.delete(`${API_BASE_URL}/assets/by-asset/${assetId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       fetchAssets();
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to delete asset");
//     }
//   };

//   // Search assets by ID
//   const handleSearch = (term: string) => {
//     const trimmed = term.trim();
//     setSearchTerm(trimmed);

//     if (!trimmed) {
//       setFilteredAssets(assets);
//     } else {
//       const filtered = assets.filter((a) =>
//         a.asset_id.toLowerCase().includes(trimmed.toLowerCase())
//       );
//       setFilteredAssets(filtered);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100">
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
//               <Package className="w-10 h-10 text-green-600" />
//               Assets
//             </h1>
//             <p className="text-gray-600 mt-2">Manage your tracked assets</p>
//           </div>

//           {/* Actions */}
//           <div className="flex gap-3 flex-wrap">
//             <input
//               type="text"
//               placeholder="Search by Asset ID..."
//               value={searchTerm}
//               onChange={(e) => handleSearch(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//             <button
//               onClick={fetchAssets}
//               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
//             >
//               <RefreshCw className="w-4 h-4" />
//               Refresh
//             </button>
//             <button
//               onClick={() => {
//                 setEditingAsset(null);
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-lg"
//             >
//               <Plus className="w-5 h-5" />
//               Add Asset
//             </button>
//           </div>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* Loading */}
//         {loading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
//           </div>
//         ) : filteredAssets.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-lg p-12 text-center">
//             <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-600 mb-2">No assets found</h3>
//             <p className="text-gray-500 mb-6">
//               {searchTerm ? "No results for this Asset ID" : "Get started by adding your first asset"}
//             </p>
//             <button
//               onClick={() => {
//                 setEditingAsset(null);
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//             >
//               Add Asset
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredAssets.map((asset) => (
//               <div
//                 key={asset.asset_id}
//                 className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6"
//               >
//                 {/* Asset Info */}
//                 <div className="flex justify-between items-start mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-3 bg-green-100 rounded-lg">
//                       <Package className="w-6 h-6 text-green-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800">{asset.asset_name}</h3>
//                       <p className="text-sm text-gray-500">{asset.asset_id}</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-600">Type:</span>
//                     <span className="font-medium text-gray-800">{asset.asset_type}</span>
//                   </div>

//                   {asset.description && (
//                     <div className="text-sm">
//                       <span className="text-gray-600">Description:</span>
//                       <p className="text-gray-800 mt-1">{asset.description}</p>
//                     </div>
//                   )}

//                   <div className="flex items-start gap-2 text-sm pt-2">
//                     <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
//                     <div className="flex-1">
//                       <span className="text-gray-600">Location:</span>
//                       <p className="text-gray-800 font-mono text-xs mt-1">
//                         {asset.registered_location.latitude.toFixed(6)},{" "}
//                         {asset.registered_location.longitude.toFixed(6)}
//                       </p>
//                     </div>
//                   </div>

//                   {asset.created_at && (
//                     <div className="flex justify-between text-sm pt-2 border-t">
//                       <span className="text-gray-600">Created:</span>
//                       <span className="font-medium text-gray-800">
//                         {new Date(asset.created_at).toLocaleDateString()}
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Actions */}
//                 <div className="flex gap-2 pt-4 border-t">
//                   <button
//                     onClick={() => {
//                       setEditingAsset(asset);
//                       setIsModalOpen(true);
//                     }}
//                     className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Edit className="w-4 h-4" />
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(asset.asset_id)}
//                     className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       <AddAssetModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditingAsset(null);
//         }}
//         onSuccess={fetchAssets}
//         editingAsset={editingAsset}
//       />
//     </div>
//   );
// }
// import { useState, useEffect } from "react";
// import { Plus, Package, MapPin, Edit, Trash2, RefreshCw, Search } from "lucide-react";
// import { AddAssetModal } from "../components/AddAssetModal";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: {
//     latitude: number;
//     longitude: number;
//   };
//   created_at?: string;
//   id?: string;
// }

// export function AssetsPage() {
//   const [assets, setAssets] = useState<Asset[]>([]);
//   const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");

//   // Fetch assets from backend
//   const fetchAssets = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       const response = await axios.get(`${API_BASE_URL}/assets`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setAssets(response.data);
//       setFilteredAssets(response.data);
//     } catch (err: any) {
//       console.error("Fetch error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to fetch assets");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAssets();
//   }, []);

//   // Delete asset
//   const handleDelete = async (assetId: string) => {
//     if (!confirm("Are you sure you want to delete this asset?")) return;

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       await axios.delete(`${API_BASE_URL}/assets/by_asset/${assetId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       fetchAssets();
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to delete asset");
//     }
//   };

//   // Search assets by ID
//   const handleSearch = (term: string) => {
//     setSearchTerm(term);
//     if (!term) {
//       setFilteredAssets(assets);
//     } else {
//       const filtered = assets.filter((a) =>
//         a.asset_id.toLowerCase().includes(term.toLowerCase())
//       );
//       setFilteredAssets(filtered);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100">
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
//               <Package className="w-10 h-10 text-green-600" />
//               Assets
//             </h1>
//             <p className="text-gray-600 mt-2">Manage your tracked assets</p>
//           </div>

//           {/* Actions */}
//           <div className="flex gap-3 flex-wrap">
//             <input
//               type="text"
//               placeholder="Search by Asset ID..."
//               value={searchTerm}
//               onChange={(e) => handleSearch(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//             <button
//               onClick={fetchAssets}
//               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
//             >
//               <RefreshCw className="w-4 h-4" />
//               Refresh
//             </button>
//             <button
//               onClick={() => {
//                 setEditingAsset(null); // clear editing
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-lg"
//             >
//               <Plus className="w-5 h-5" />
//               Add Asset
//             </button>
//           </div>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* Loading */}
//         {loading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
//           </div>
//         ) : filteredAssets.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-lg p-12 text-center">
//             <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-600 mb-2">No assets found</h3>
//             <p className="text-gray-500 mb-6">
//               {searchTerm ? "No results for this Asset ID" : "Get started by adding your first asset"}
//             </p>
//             <button
//               onClick={() => {
//                 setEditingAsset(null);
//                 setIsModalOpen(true);
//               }}
//               className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//             >
//               Add Asset
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredAssets.map((asset) => (
//               <div
//                 key={asset.id}
//                 className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6"
//               >
//                 {/* Asset Info */}
//                 <div className="flex justify-between items-start mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-3 bg-green-100 rounded-lg">
//                       <Package className="w-6 h-6 text-green-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800">{asset.asset_name}</h3>
//                       <p className="text-sm text-gray-500">{asset.asset_id}</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2 mb-4">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-600">Type:</span>
//                     <span className="font-medium text-gray-800">{asset.asset_type}</span>
//                   </div>

//                   {asset.description && (
//                     <div className="text-sm">
//                       <span className="text-gray-600">Description:</span>
//                       <p className="text-gray-800 mt-1">{asset.description}</p>
//                     </div>
//                   )}

//                   <div className="flex items-start gap-2 text-sm pt-2">
//                     <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
//                     <div className="flex-1">
//                       <span className="text-gray-600">Location:</span>
//                       <p className="text-gray-800 font-mono text-xs mt-1">
//                         {asset.registered_location.latitude.toFixed(6)},{" "}
//                         {asset.registered_location.longitude.toFixed(6)}
//                       </p>
//                     </div>
//                   </div>

//                   {asset.created_at && (
//                     <div className="flex justify-between text-sm pt-2 border-t">
//                       <span className="text-gray-600">Created:</span>
//                       <span className="font-medium text-gray-800">
//                         {new Date(asset.created_at).toLocaleDateString()}
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Actions */}
//                 <div className="flex gap-2 pt-4 border-t">
//                   <button
//                     onClick={() => {
//                       setEditingAsset(asset);
//                       setIsModalOpen(true);
//                     }}
//                     className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Edit className="w-4 h-4" />
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(asset.asset_id)}
//                     className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       <AddAssetModal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setEditingAsset(null);
//         }}
//         onSuccess={fetchAssets}
//         editingAsset={editingAsset}
//       />
//     </div>
//   );
// }




