// import { useState, useEffect } from "react";
// import { Plus, Smartphone, Battery, Edit, Trash2, RefreshCw } from "lucide-react";
// import axios from "axios";
// import { AddDeviceModal } from "../components/AddDeviceModal";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Device {
//   id: string;                 // MONGO ID
//   device_id: string;          // USER DEVICE ID
//   device_name?: string;
//   device_model?: string;
//   device_status?: string;
//   battery_level?: number;
// }

// export function DevicesPage() {
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingDevice, setEditingDevice] = useState<Device | null>(null);

//   // FETCH DEVICES
//   const fetchDevices = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       const response = await axios.get(`${API_BASE_URL}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setDevices(response.data);
//       setError("");
//     } catch (err: any) {
//       console.error("Fetch Error:", err);
//       setError(err.response?.data?.detail || "Failed to fetch devices");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDevices();
//   }, []);

  

//   // DELETE DEVICE
//   const handleDelete = async (deviceId: string) => {
//   if (!confirm("Delete this device?")) return;

//   try {
//     const token = localStorage.getItem("auth_token");
//     if (!token) throw new Error("Not authenticated");

//     await axios.delete(`${API_BASE_URL}/devices/by-device/${deviceId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     fetchDevices();
//   } catch (err: any) {
//     alert(err.response?.data?.detail || "Failed to delete device");
//   }
// };
//   // const handleDelete = async (deviceId: string) => {
//   //   if (!confirm("Delete this device?")) return;

//   //   try {
//   //     const token = localStorage.getItem("auth_token");
//   //     if (!token) throw new Error("Not authenticated");

//   //     await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
//   //       headers: { Authorization: `Bearer ${token}` },
//   //     });

//   //     fetchDevices();
//   //   } catch (err: any) {
//   //     alert(err.response?.data?.detail || "Failed to delete device");
//   //   }
//   // };

//   // STATUS BADGE COLOR
//   const getStatusColor = (status?: string) => {
//     switch (status) {
//       case "online":
//         return "bg-green-100 text-green-800";
//       case "offline":
//         return "bg-gray-100 text-gray-800";
//       case "maintenance":
//         return "bg-yellow-100 text-yellow-800";
//       case "error":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   // BATTERY COLOR
//   const getBatteryColor = (level?: number) => {
//     if (level == null) return "text-gray-400";
//     if (level > 60) return "text-green-600";
//     if (level > 30) return "text-yellow-600";
//     return "text-red-600";
//   };

//   const openAddModal = () => {
//     setEditingDevice(null);
//     setModalOpen(true);
//   };

//   const openEditModal = (device: Device) => {
//     setEditingDevice(device);
//     setModalOpen(true);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
//       <div className="max-w-7xl mx-auto px-4 py-8">
        
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
//               <Smartphone className="w-10 h-10 text-blue-600" /> Devices
//             </h1>
//             <p className="text-gray-600 mt-2">Manage your GPS tracking devices</p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={fetchDevices}
//               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
//             >
//               <RefreshCw className="w-4 h-4" /> Refresh
//             </button>

//             <button
//               onClick={openAddModal}
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
//             >
//               <Plus className="w-5 h-5" /> Add Device
//             </button>
//           </div>
//         </div>

//         {/* Loading */}
//         {loading && (
//           <div className="flex justify-center items-center h-48">
//             <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600"></div>
//           </div>
//         )}

//         {/* Error */}
//         {!loading && error && (
//           <div className="text-center text-red-600 font-medium">{error}</div>
//         )}

//         {/* No Devices */}
//         {!loading && !error && devices.length === 0 && (
//           <div className="bg-white rounded-xl shadow-lg p-12 text-center">
//             <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-600 mb-2">No devices yet</h3>
//             <p className="text-gray-500 mb-6">Add your first GPS device now.</p>
//             <button
//               onClick={openAddModal}
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//             >
//               Add Device
//             </button>
//           </div>
//         )}

//         {/* Device Grid */}
//         {!loading && !error && devices.length > 0 && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {devices.map((device) => (
//               <div key={device.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition">
                
//                 {/* Top Section */}
//                 <div className="flex justify-between items-start mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-3 bg-blue-100 rounded-lg">
//                       <Smartphone className="w-6 h-6 text-blue-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800">
//                         {device.device_name || device.device_id}
//                       </h3>
//                       <p className="text-sm text-gray-500">{device.device_id}</p>
//                     </div>
//                   </div>
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.device_status)}`}>
//                     {device.device_status || "unknown"}
//                   </span>
//                 </div>

//                 {/* Details */}
//                 <div className="space-y-2 mb-4">
//                   {device.device_model && (
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">Model:</span>
//                       <span className="font-medium text-gray-800">{device.device_model}</span>
//                     </div>
//                   )}

//                   {device.battery_level != null && (
//                     <div className="flex justify-between text-sm items-center">
//                       <span className="text-gray-600">Battery:</span>
//                       <span className={`font-medium flex items-center gap-1 ${getBatteryColor(device.battery_level)}`}>
//                         <Battery className="w-4 h-4" /> {device.battery_level}%
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Actions */}
//                 <div className="flex gap-2 pt-4 border-t">
//                   <button
//                     onClick={() => openEditModal(device)}
//                     className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Edit className="w-4 h-4" /> Edit
//                   </button>

//                   <button
//                     onClick={() => handleDelete(device.device_id)}
//                     className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
//                   >
//                     <Trash2 className="w-4 h-4" /> Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* MODAL */}
//       <AddDeviceModal
//         isOpen={modalOpen}
//         onClose={() => setModalOpen(false)}
//         onSuccess={fetchDevices}
//         editingDevice={editingDevice}
//       />
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { Plus, Smartphone, Battery, Edit, Trash2, RefreshCw, Eye } from "lucide-react";
import axios from "axios";
import { AddDeviceModal } from "../components/AddDeviceModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

interface Device {
  id: string;                 // MONGO ID
  device_id: string;          // USER DEVICE ID
  device_name?: string;
  device_model?: string;
  device_status?: string;
  battery_level?: number;
  time_stamp?: string;
}

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [viewDevice, setViewDevice] = useState<Device | null>(null);

  // FETCH DEVICES
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const response = await axios.get(`${API_BASE_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDevices(response.data);
      setError("");
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.response?.data?.detail || "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // DELETE DEVICE
  const handleDelete = async (deviceId: string) => {
    if (!confirm("Delete this device?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      await axios.delete(`${API_BASE_URL}/devices/by-device/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDevices();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete device");
    }
  };

  // STATUS BADGE COLOR
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // BATTERY COLOR
  const getBatteryColor = (level?: number) => {
    if (level == null) return "text-gray-400";
    if (level > 60) return "text-green-600";
    if (level > 30) return "text-yellow-600";
    return "text-red-600";
  };

  const openAddModal = () => {
    setEditingDevice(null);
    setViewDevice(null);
    setModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setViewDevice(null);
    setModalOpen(true);
  };

  // VIEW: fetch fresh details from backend and open modal in view mode
  const openViewModal = async (device_id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const res = await axios.get(`${API_BASE_URL}/devices/by-device/${device_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setViewDevice(res.data);
      // ensure editingDevice is cleared
      setEditingDevice(null);
      setModalOpen(true); // reuse same modal component (it will render read-only when viewDevice provided)
    } catch (err: any) {
      console.error("Failed to fetch device details:", err);
      alert(err.response?.data?.detail || "Failed to fetch device details");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Smartphone className="w-10 h-10 text-blue-600" /> Devices
            </h1>
            <p className="text-gray-600 mt-2">Manage your GPS tracking devices</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchDevices}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>

            <button
              onClick={openAddModal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" /> Add Device
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center text-red-600 font-medium">{error}</div>
        )}

        {/* No Devices */}
        {!loading && !error && devices.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No devices yet</h3>
            <p className="text-gray-500 mb-6">Add your first GPS device now.</p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Device
            </button>
          </div>
        )}

        {/* Device Grid */}
        {!loading && !error && devices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div key={device.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 transition">
                
                {/* Top Section */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {device.device_name || device.device_id}
                      </h3>
                      <p className="text-sm text-gray-500">{device.device_id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.device_status)}`}>
                    {device.device_status || "unknown"}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {device.device_model && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium text-gray-800">{device.device_model}</span>
                    </div>
                  )}

                  {device.battery_level != null && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">Battery:</span>
                      <span className={`font-medium flex items-center gap-1 ${getBatteryColor(device.battery_level)}`}>
                        <Battery className="w-4 h-4" /> {device.battery_level}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => openViewModal(device.device_id)}
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>

                  <button
                    onClick={() => openEditModal(device)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(device.device_id)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: reuse same AddDeviceModal component for add/edit/view */}
      <AddDeviceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDevice(null);
          setViewDevice(null);
        }}
        onSuccess={() => {
          fetchDevices();
          setModalOpen(false);
          setEditingDevice(null);
          setViewDevice(null);
        }}
        editingDevice={editingDevice}
        viewDevice={viewDevice}
      />
    </div>
  );
}

