import { useState, useEffect } from "react";
import { Plus, Smartphone, Battery, Edit, Trash2, RefreshCw } from "lucide-react";
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
}

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

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
  // const handleDelete = async (deviceId: string) => {
  //   if (!confirm("Delete this device?")) return;

  //   try {
  //     const token = localStorage.getItem("auth_token");
  //     if (!token) throw new Error("Not authenticated");

  //     await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     fetchDevices();
  //   } catch (err: any) {
  //     alert(err.response?.data?.detail || "Failed to delete device");
  //   }
  // };

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
    setModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setModalOpen(true);
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

      {/* MODAL */}
      <AddDeviceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchDevices}
        editingDevice={editingDevice}
      />
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { Plus, Smartphone, Battery, Edit, Trash2, RefreshCw } from "lucide-react";
// import axios from "axios";
// import { AddDeviceModal } from "../components/AddDeviceModal";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Device {
//   id: string;
//   device_id: string;
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

//   const fetchDevices = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       const response = await axios.get(`${API_BASE_URL}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setDevices(response.data);
//     } catch (err: any) {
//       console.error("Fetch error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to fetch devices");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDevices();
//   }, []);

//   const handleDelete = async (deviceId: string) => {
//     if (!confirm("Are you sure you want to delete this device?")) return;

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       fetchDevices();
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to delete device");
//     }
//   };

//   const getStatusColor = (status?: string) => {
//     switch (status) {
//       case "online": return "bg-green-100 text-green-800";
//       case "offline": return "bg-gray-100 text-gray-800";
//       case "maintenance": return "bg-yellow-100 text-yellow-800";
//       case "error": return "bg-red-100 text-red-800";
//       default: return "bg-gray-100 text-gray-800";
//     }
//   };

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

//         {loading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//           </div>
//         ) : devices.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-lg p-12 text-center">
//             <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-600 mb-2">No devices yet</h3>
//             <p className="text-gray-500 mb-6">Get started by adding your first GPS device</p>
//             <button
//               onClick={openAddModal}
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//             >
//               Add Your First Device
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {devices.map((device) => (
//               <div key={device.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6">
//                 <div className="flex justify-between items-start mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-3 bg-blue-100 rounded-lg">
//                       <Smartphone className="w-6 h-6 text-blue-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800">{device.device_name || device.device_id}</h3>
//                       <p className="text-sm text-gray-500">{device.device_id}</p>
//                     </div>
//                   </div>
//                   <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.device_status)}`}>
//                     {device.device_status}
//                   </span>
//                 </div>

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

//       <AddDeviceModal
//         isOpen={modalOpen}
//         onClose={() => setModalOpen(false)}
//         onSuccess={fetchDevices}
//         editingDevice={editingDevice}
//       />
//     </div>
//   );
// }
// import { useState, useEffect } from "react";
// import { Plus, Smartphone, Battery, Edit, Trash2, RefreshCw } from "lucide-react";
// import axios from "axios";
// import { AddDeviceModal } from "../components/AddDeviceModal";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Device {
//   id: string;
//   device_id: string;
//   device_name?: string;
//   device_model?: string;
//   device_status?: string;
//   battery_level?: number;
// }

// export function DevicesPage() {
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const fetchDevices = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       const response = await axios.get(`${API_BASE_URL}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setDevices(response.data);
//     } catch (err: any) {
//       console.error("Fetch error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to fetch devices");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDevices();
//   }, []);

//   const handleDelete = async (deviceId: string) => {
//     if (!confirm("Are you sure you want to delete this device?")) return;

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       fetchDevices();
//     } catch (err: any) {
//       alert(err.response?.data?.detail || "Failed to delete device");
//     }
//   };

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

//   const getBatteryColor = (level?: number) => {
//     if (level == null) return "text-gray-400";
//     if (level > 60) return "text-green-600";
//     if (level > 30) return "text-yellow-600";
//     return "text-red-600";
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
//               <Smartphone className="w-10 h-10 text-blue-600" />
//               Devices
//             </h1>
//             <p className="text-gray-600 mt-2">Manage your GPS tracking devices</p>
//           </div>

//           <div className="flex gap-3">
//             <button
//               onClick={fetchDevices}
//               className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
//             >
//               <RefreshCw className="w-4 h-4" />
//               Refresh
//             </button>

//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
//             >
//               <Plus className="w-5 h-5" />
//               Add Device
//             </button>
//           </div>
//         </div>

//         {loading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//           </div>
//         ) : devices.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-lg p-12 text-center">
//             <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-600 mb-2">No devices yet</h3>
//             <p className="text-gray-500 mb-6">Get started by adding your first GPS device</p>
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//             >
//               Add Your First Device
//             </button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {devices.map((device) => (
//               <div
//                 key={device.id}
//                 className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6"
//               >
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
//                   <span
//                     className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
//                       device.device_status
//                     )}`}
//                   >
//                     {device.device_status}
//                   </span>
//                 </div>

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
//                       <span
//                         className={`font-medium flex items-center gap-1 ${getBatteryColor(
//                           device.battery_level
//                         )}`}
//                       >
//                         <Battery className="w-4 h-4" />
//                         {device.battery_level}%
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex gap-2 pt-4 border-t">
//                   <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2 text-sm">
//                     <Edit className="w-4 h-4" />
//                     Edit
//                   </button>

//                   <button
//                     onClick={() => handleDelete(device.device_id)}
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

//       <AddDeviceModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSuccess={fetchDevices}
//       />
//     </div>
//   );
// }





// import { useEffect, useState } from "react";
// import { Plus, Search, Battery, Trash2, Pencil } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";
// import axios from "axios";

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Device {
//   id: string;
//   device_id: string;
//   device_name: string;
//   device_model: string;
//   device_status: string;
//   battery_level: number | null;
//   last_seen: string | null;
//   user_id: string;
// }

// // // -------------------- ConfirmModal --------------------
// // interface ConfirmModalProps {
// //   title?: string;
// //   message: string;
// //   onConfirm: () => void;
// //   onCancel: () => void;
// // }

// // function ConfirmModal({ title, message, onConfirm, onCancel }: ConfirmModalProps) {
// //   return (
// //     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
// //       <div className="bg-white p-6 rounded w-96 space-y-4">
// //         {title && <h2 className="text-xl font-bold">{title}</h2>}
// //         <p>{message}</p>
// //         <div className="flex justify-end gap-2">
// //           <button onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
// //           <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // -------------------- Add/Edit Device Modal --------------------
// interface DeviceModalProps {
//   device?: Device | null;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// function DeviceModal({ device, onClose, onSuccess }: DeviceModalProps) {
//   const { user } = useAuth();
//   const [deviceId, setDeviceId] = useState(device?.device_id || "");
//   const [deviceName, setDeviceName] = useState(device?.device_name || "");
//   const [deviceModel, setDeviceModel] = useState(device?.device_model || "");
//   const [batteryLevel, setBatteryLevel] = useState<number | "">(device?.battery_level ?? "");
//   const [deviceStatus, setDeviceStatus] = useState(device?.device_status || "offline");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       const payload = {
//         device_id: deviceId,
//         device_name: deviceName,
//         device_model: deviceModel,
//         battery_level: batteryLevel === "" ? null : Number(batteryLevel),
//         device_status: deviceStatus,
//       };

//       if (device) {
//         // Edit device
//         await axios.put(`${API_BASE}/devices/${device.id}`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         // Add device
//         await axios.post(`${API_BASE}/devices`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       setError(err.response?.data?.detail || err.message || "Operation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
//       <div className="bg-white p-6 rounded w-96 space-y-4">
//         <h2 className="text-xl font-bold mb-2">{device ? "Edit Device" : "Add Device"}</h2>
//         {error && <p className="text-red-500">{error}</p>}
//         <form onSubmit={handleSubmit} className="space-y-2">
//           <input type="text" placeholder="Device ID" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required className="border p-2 w-full rounded" />
//           <input type="text" placeholder="Device Name" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} className="border p-2 w-full rounded" />
//           <input type="text" placeholder="Device Model" value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} className="border p-2 w-full rounded" />
//           <input type="number" placeholder="Battery Level" value={batteryLevel} onChange={(e) => setBatteryLevel(e.target.value === "" ? "" : Number(e.target.value))} className="border p-2 w-full rounded" min={0} max={100} />
//           <select value={deviceStatus} onChange={(e) => setDeviceStatus(e.target.value)} className="border p-2 w-full rounded">
//             <option value="offline">Offline</option>
//             <option value="online">Online</option>
//             <option value="maintenance">Maintenance</option>
//             <option value="error">Error</option>
//           </select>
//           <div className="flex justify-end gap-2 mt-4">
//             <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
//             <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">{loading ? "Saving..." : "Save"}</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // -------------------- DevicesPage --------------------
// export function DevicesPage() {
//   const { user } = useAuth();
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showDeviceModal, setShowDeviceModal] = useState<Device | null>(null);
//   const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);

//   const token = localStorage.getItem("auth_token");

//   useEffect(() => { loadDevices(); }, [user]);
//   useEffect(() => { filterDevices(); }, [devices, searchQuery]);

//   const loadDevices = async () => {
//     if (!user) return;
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/devices/?user_id=${user.id}`, {
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       });
//       if (res.status === 401) return console.error("401: Invalid token");
//       const data = await res.json();
//       const mapped = data.map((d: any) => ({ id: d._id || d.id, ...d }));
//       setDevices(mapped);
//     } catch (error) { console.error(error); } finally { setLoading(false); }
//   };

//   const filterDevices = () => {
//     const filtered = devices.filter((d) => (d.device_name + d.device_id).toLowerCase().includes(searchQuery.toLowerCase()));
//     setFilteredDevices(filtered);
//   };

//   const getBatteryColor = (level: number | null) => {
//     if (level === null) return "text-gray-400";
//     if (level > 50) return "text-green-600";
//     if (level > 25) return "text-amber-600";
//     return "text-red-600";
//   };

//   if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

//   return (
//     <div className="space-y-6">
//       {/* Search + Add */}
//       <div className="flex items-center justify-between">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//           <input type="text" placeholder="Search devices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
//         </div>
//         <button onClick={() => setShowDeviceModal(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center space-x-2">
//           <Plus className="w-5 h-5" />
//           <span>Add Device</span>
//         </button>
//       </div>

//       {/* Device List */}
//       {filteredDevices.length === 0 ? (
//         <div className="p-10 border rounded-lg text-center bg-white">
//           <h3 className="text-lg font-semibold">No devices found</h3>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredDevices.map((device) => (
//             <div key={device.id} className="flex justify-between items-center p-4 bg-white border rounded-lg">
//               <div>
//                 <h3 className="font-semibold">{device.device_name}</h3>
//                 <p className="text-sm text-gray-500">{device.device_id}</p>
//                 <div className="flex items-center mt-2">
//                   <Battery className={`w-5 h-5 mr-2 ${getBatteryColor(device.battery_level)}`} />
//                   <span>{device.battery_level ?? 0}%</span>
//                 </div>
//               </div>
//               <div className="flex space-x-2">
//                 <button className="p-2 bg-yellow-100 text-yellow-700 rounded-lg" onClick={() => setShowDeviceModal(device)}>
//                   <Pencil className="w-5 h-5" />
//                 </button>
//                 <button className="p-2 bg-red-100 text-red-700 rounded-lg" onClick={() => setDeletingDevice(device)}>
//                   <Trash2 className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Modals */}
//       {showDeviceModal !== undefined && (
//         <DeviceModal
//           device={showDeviceModal}
//           onClose={() => setShowDeviceModal(null)}
//           onSuccess={loadDevices}
//         />
//       )}

//       {deletingDevice && (
//         <ConfirmModal
//           title="Delete Device"
//           message={`Are you sure you want to delete "${deletingDevice.device_name}"?`}
//           onCancel={() => setDeletingDevice(null)}
//           onConfirm={async () => {
//             try {
//               const token = localStorage.getItem("auth_token");
//               if (!token) throw new Error("Not authenticated");
//               const res = await fetch(`${API_BASE}/devices/${deletingDevice.id}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` },
//               });
//               if (!res.ok) throw new Error("Delete failed");
//               setDevices(devices.filter((d) => d.id !== deletingDevice.id));
//               setDeletingDevice(null);
//             } catch (error) {
//               console.error(error);
//             }
//           }}
//         />
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from 'react';
// import { Plus, Search, Battery, Trash2 } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
// import { AddDeviceModal } from './AddDeviceModal';

// const API_BASE = "http://127.0.0.1:8000";
// const token = localStorage.getItem("auth_token");

// interface Device {
//   id: string;
//   device_id: string;
//   device_name: string;
//   device_model: string;
//   device_status: string;
//   battery_level: number | null;
//   last_seen: string | null;
//   user_id: string;
// }

// export function DevicesPage() {
//   const { user } = useAuth();
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showAddModal, setShowAddModal] = useState(false);

//   useEffect(() => {
//     loadDevices();
//   }, [user]);

//   useEffect(() => {
//     filterDevices();
//   }, [devices, searchQuery]);

//   const loadDevices = async () => {
//     if (!user) return;

//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/devices?user_id=${user.id}`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) throw new Error("Failed to fetch devices");
//       const data = await res.json();

//       // Convert _id → id
//       const mapped = data.map((d: any) => ({
//         id: d._id || d.id,
//         ...d,
//       }));

//       setDevices(mapped);
//     } catch (error) {
//       console.error("Error loading devices:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterDevices = () => {
//     const filtered = devices.filter(d =>
//       d.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     setFilteredDevices(filtered);
//   };

//   const deleteDevice = async (id: string) => {
//     if (!confirm("Are you sure you want to delete this device?")) return;

//     try {
//       const res = await fetch(`${API_BASE}/devices/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) throw new Error("Delete failed");

//       setDevices(devices.filter(d => d.id !== id));
//     } catch (error) {
//       console.error("Error deleting:", error);
//     }
//   };

//   const getBatteryColor = (level: number | null) => {
//     if (level === null) return "text-gray-400";
//     if (level > 50) return "text-green-600";
//     if (level > 25) return "text-amber-600";
//     return "text-red-600";
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {/* Search + Add */}
//       <div className="flex items-center justify-between">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search devices..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border rounded-lg"
//           />
//         </div>

//         <button
//           onClick={() => setShowAddModal(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center space-x-2"
//         >
//           <Plus className="w-5 h-5" />
//           <span>Add Device</span>
//         </button>
//       </div>

//       {/* Device List */}
//       {filteredDevices.length === 0 ? (
//         <div className="p-10 border rounded-lg text-center bg-white">
//           <h3 className="text-lg font-semibold">No devices found</h3>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredDevices.map((device) => (
//             <div key={device.id} className="p-6 border rounded-lg bg-white">
//               <div className="flex justify-between">
//                 <div>
//                   <h3 className="font-semibold">{device.device_name}</h3>
//                   <p className="text-sm text-gray-500">{device.device_id}</p>
//                 </div>

//                 <button
//                   onClick={() => deleteDevice(device.id)}
//                   className="p-2 hover:bg-red-50 rounded-lg"
//                 >
//                   <Trash2 className="text-red-600 w-5 h-5" />
//                 </button>
//               </div>

//               <div className="flex items-center mt-4">
//                 <Battery className={`w-5 h-5 mr-2 ${getBatteryColor(device.battery_level)}`} />
//                 <span>{device.battery_level ?? 0}%</span>
//               </div>

//             </div>
//           ))}
//         </div>
//       )}

//       {showAddModal && (
//         <AddDeviceModal
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             loadDevices();
//           }}
//         />
//       )}
//     </div>
//   );
// }


// import { useEffect, useState } from 'react';
// import { Plus, Search, Grid3x3, List, Battery, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
// import { AddDeviceModal } from './AddDeviceModal';

// const API_BASE = "https://your-backend-url"; // ✅ change only <this></this>*/
// /*const API_BASE = "http://127.0.0.1:8000";*/
// interface Device {
//   id: string;
//   device_id: string;
//   device_name: string;
//   device_model: string;
//   device_status: string;
//   battery_level: number | null;
//   latitude: number | null;
//   longitude: number | null;
//   last_seen: string | null;
//   user_id: string;
// }

// export function DevicesPage() {
//   const { user } = useAuth();
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showAddModal, setShowAddModal] = useState(false);

//   useEffect(() => {
//     loadDevices();
//   }, [user]);

//   useEffect(() => {
//     filterDevices();
//   }, [devices, filterStatus, searchQuery]);

//   const loadDevices = async () => {
//     if (!user) return;

//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/devices?user_id=${user.id}`, {
//         headers: {
//           Authorization: `Bearer ${user.id}`,
//         },
//       });

//       if (!res.ok) throw new Error("Failed to fetch devices");
//       const data = await res.json();
//       setDevices(data);
//     } catch (error) {
//       console.error("Error loading devices:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterDevices = () => {
//     let filtered = devices;

//     if (filterStatus !== 'all') {
//       filtered = filtered.filter(d => d.device_status === filterStatus);
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(d =>
//         d.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     setFilteredDevices(filtered);
//   };

//   const deleteDevice = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this device?')) return;

//     try {
//       const res = await fetch(`${API_BASE}/api/devices/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${user.id}`,
//         },
//       });

//       if (!res.ok) throw new Error("Failed to delete device");
//       setDevices(devices.filter(d => d.id !== id));
//     } catch (error) {
//       console.error("Error deleting device:", error);
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'online': return 'bg-teal-500';
//       case 'offline': return 'bg-gray-500';
//       case 'maintenance': return 'bg-amber-500';
//       default: return 'bg-gray-500';
//     }
//   };

//   const getBatteryColor = (level: number | null) => {
//     if (!level) return 'text-gray-400';
//     if (level > 50) return 'text-teal-600';
//     if (level > 25) return 'text-amber-600';
//     return 'text-red-600';
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {/* Search + View + Add */}
//       <div className="flex items-center justify-between">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search devices..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//           />
//         </div>

//         <button
//           onClick={() => setShowAddModal(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
//         >
//           <Plus className="w-5 h-5" />
//           <span>Add Device</span>
//         </button>
//       </div>

//       {/* Device List */}
//       {filteredDevices.length === 0 ? (
//         <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">No devices found</h3>
//         </div>
//       ) : (
//         <div className={viewMode === 'grid'
//           ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
//           : 'space-y-4'
//         }>
//           {filteredDevices.map((device) => (
//             <div key={device.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">

//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-center space-x-3">
//                   <div className={`w-3 h-3 rounded-full ${getStatusColor(device.device_status)}`}></div>
//                   <div>
//                     <h3 className="font-semibold text-gray-900">{device.device_name}</h3>
//                     <p className="text-sm text-gray-500">{device.device_id}</p>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => deleteDevice(device.id)}
//                   className="p-2 hover:bg-red-50 rounded-lg transition"
//                 >
//                   <Trash2 className="w-4 h-4 text-red-600" />
//                 </button>
//               </div>

//               <div className="space-y-2">
//                 <div className="flex items-center justify-between text-sm">
//                   <Battery className={`w-4 h-4 mr-2 ${getBatteryColor(device.battery_level)}`} />
//                   <span className="font-medium text-gray-900">{device.battery_level || 0}%</span>
//                 </div>
//               </div>

//             </div>
//           ))}
//         </div>
//       )}

//       {showAddModal && (
//         <AddDeviceModal
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             loadDevices();
//           }}
//         />
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from 'react';
// import { Plus, Search, Grid3x3, List, Battery, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';
// import { supabase } from '../lib/supabase';
// import { useAuth } from '../contexts/AuthContext';
// import { AddDeviceModal } from './AddDeviceModal';

// interface Device {
//   id: string;
//   device_id: string;
//   name: string;
//   status: string;
//   battery_level: number | null;
//   latitude: number | null;
//   longitude: number | null;
//   speed: number | null;
//   last_seen: string | null;
// }

// export function DevicesPage() {
//   const { user } = useAuth();
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
//   const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showAddModal, setShowAddModal] = useState(false);

//   useEffect(() => {
//     loadDevices();
//   }, [user]);

//   useEffect(() => {
//     filterDevices();
//   }, [devices, filterStatus, searchQuery]);

//   const loadDevices = async () => {
//     if (!user) return;

//     try {
//       const { data, error } = await supabase
//         .from('devices')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       setDevices(data || []);
//     } catch (error) {
//       console.error('Error loading devices:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterDevices = () => {
//     let filtered = devices;

//     if (filterStatus !== 'all') {
//       filtered = filtered.filter(d => d.status === filterStatus);
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(d =>
//         d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     setFilteredDevices(filtered);
//   };

//   const deleteDevice = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this device?')) return;

//     try {
//       const { error } = await supabase.from('devices').delete().eq('id', id);
//       if (error) throw error;
//       setDevices(devices.filter(d => d.id !== id));
//     } catch (error) {
//       console.error('Error deleting device:', error);
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'online': return 'bg-teal-500';
//       case 'offline': return 'bg-gray-500';
//       case 'maintenance': return 'bg-amber-500';
//       case 'error': return 'bg-red-500';
//       default: return 'bg-gray-500';
//     }
//   };

//   const getBatteryColor = (level: number | null) => {
//     if (!level) return 'text-gray-400';
//     if (level > 50) return 'text-teal-600';
//     if (level > 25) return 'text-amber-600';
//     return 'text-red-600';
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search devices..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//           />
//         </div>

//         <div className="flex items-center space-x-3">
//           <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
//             <button
//               onClick={() => setViewMode('grid')}
//               className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
//             >
//               <Grid3x3 className="w-5 h-5" />
//             </button>
//             <button
//               onClick={() => setViewMode('list')}
//               className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
//             >
//               <List className="w-5 h-5" />
//             </button>
//           </div>
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
//           >
//             <Plus className="w-5 h-5" />
//             <span>Add Device</span>
//           </button>
//         </div>
//       </div>

//       <div className="flex items-center space-x-2">
//         {['all', 'online', 'offline'].map((status) => {
//           const count = status === 'all'
//             ? devices.length
//             : devices.filter(d => d.status === status).length;

//           return (
//             <button
//               key={status}
//               onClick={() => setFilterStatus(status as any)}
//               className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                 filterStatus === status
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
//               }`}
//             >
//               {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
//             </button>
//           );
//         })}
//       </div>

//       {filteredDevices.length === 0 ? (
//         <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <MapPin className="w-8 h-8 text-gray-400" />
//           </div>
//           <h3 className="text-lg font-semibold text-gray-900 mb-2">No devices found</h3>
//           <p className="text-gray-600 mb-6">Get started by adding your first GPS tracking device</p>
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//           >
//             Add Device
//           </button>
//         </div>
//       ) : (
//         <div className={viewMode === 'grid'
//           ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
//           : 'space-y-4'
//         }>
//           {filteredDevices.map((device) => (
//             <div
//               key={device.id}
//               className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
//             >
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-center space-x-3">
//                   <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
//                   <div>
//                     <h3 className="font-semibold text-gray-900">{device.name}</h3>
//                     <p className="text-sm text-gray-500">{device.device_id}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-1">
//                   <button className="p-2 hover:bg-gray-100 rounded-lg transition">
//                     <Edit2 className="w-4 h-4 text-gray-600" />
//                   </button>
//                   <button
//                     onClick={() => deleteDevice(device.id)}
//                     className="p-2 hover:bg-red-50 rounded-lg transition"
//                   >
//                     <Trash2 className="w-4 h-4 text-red-600" />
//                   </button>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-gray-600 flex items-center">
//                     <Battery className={`w-4 h-4 mr-2 ${getBatteryColor(device.battery_level)}`} />
//                     Battery
//                   </span>
//                   <span className="font-medium text-gray-900">{device.battery_level || 0}%</span>
//                 </div>

//                 {device.latitude && device.longitude && (
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600 flex items-center">
//                       <MapPin className="w-4 h-4 mr-2" />
//                       Location
//                     </span>
//                     <span className="font-medium text-gray-900 text-xs">
//                       {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
//                     </span>
//                   </div>
//                 )}

//                 {device.last_seen && (
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600 flex items-center">
//                       <Clock className="w-4 h-4 mr-2" />
//                       Last Seen
//                     </span>
//                     <span className="font-medium text-gray-900 text-xs">
//                       {new Date(device.last_seen).toLocaleTimeString()}
//                     </span>
//                   </div>
//                 )}
//               </div>

//               <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
//                 <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
//                   View Details
//                 </button>
//                 <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm font-medium">
//                   Track
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {showAddModal && (
//         <AddDeviceModal
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             loadDevices();
//           }}
//         />
//       )}
//     </div>
//   );
// }
// import { useEffect, useState } from "react";
// import { Plus, Search, Battery, Trash2, Pencil } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";
// import { AddDeviceModal } from "./AddDeviceModal";

// const API_BASE = "http://127.0.0.1:8000";

// interface Device {
//   id: string;
//   device_id: string;
//   device_name: string;
//   device_model: string;
//   device_status: string;
//   battery_level: number | null;
//   last_seen: string | null;
//   user_id: string;
// }

// export function DevicesPage() {
//   const { user } = useAuth();
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [editingDevice, setEditingDevice] = useState<Device | null>(null);

//   const token = localStorage.getItem("auth_token");

//   useEffect(() => {
//     loadDevices();
//   }, [user]);

//   useEffect(() => {
//     filterDevices();
//   }, [devices, searchQuery]);

//   // --------------------------------
//   // Load Devices
//   // --------------------------------
//   const loadDevices = async () => {
//     if (!user) return;

//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/devices/?user_id=${user.id}`, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (res.status === 401) {
//         console.error("401: Invalid token");
//         return;
//       }

//       const data = await res.json();

//       const mapped = data.map((d: any) => ({
//         id: d._id || d.id,
//         ...d,
//       }));

//       setDevices(mapped);
//     } catch (error) {
//       console.error("Error loading devices:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterDevices = () => {
//     const filtered = devices.filter((d) =>
//       (d.device_name + d.device_id)
//         .toLowerCase()
//         .includes(searchQuery.toLowerCase())
//     );
//     setFilteredDevices(filtered);
//   };

//   // --------------------------------
//   // Delete device
//   // --------------------------------
//   const deleteDevice = async (id: string) => {
//     if (!confirm("Delete this device?")) return;

//     try {
//       const res = await fetch(`${API_BASE}/devices/${id}`, {
//         method: "DELETE",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) throw new Error("Delete failed");

//       setDevices(devices.filter((d) => d.id !== id));
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   // --------------------------------
//   // Update device
//   // --------------------------------
//   const updateDevice = async () => {
//     if (!editingDevice) return;

//     try {
//       const res = await fetch(`${API_BASE}/devices/${editingDevice.id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(editingDevice),
//       });

//       if (!res.ok) throw new Error("Update failed");

//       loadDevices();
//       setEditingDevice(null);
//     } catch (error) {
//       console.error("Error updating:", error);
//     }
//   };

//   const getBatteryColor = (level: number | null) => {
//     if (level === null) return "text-gray-400";
//     if (level > 50) return "text-green-600";
//     if (level > 25) return "text-amber-600";
//     return "text-red-600";
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {/* Search + Add */}
//       <div className="flex items-center justify-between">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search devices..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border rounded-lg"
//           />
//         </div>

//         <button
//           onClick={() => setShowAddModal(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center space-x-2"
//         >
//           <Plus className="w-5 h-5" />
//           <span>Add Device</span>
//         </button>
//       </div>

//       {/* Device List */}
//       {filteredDevices.length === 0 ? (
//         <div className="p-10 border rounded-lg text-center bg-white">
//           <h3 className="text-lg font-semibold">No devices found</h3>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {filteredDevices.map((device) => (
//             <div
//               key={device.id}
//               className="flex justify-between items-center p-4 bg-white border rounded-lg"
//             >
//               <div>
//                 <h3 className="font-semibold">{device.device_name}</h3>
//                 <p className="text-sm text-gray-500">{device.device_id}</p>

//                 <div className="flex items-center mt-2">
//                   <Battery className={`w-5 h-5 mr-2 ${getBatteryColor(device.battery_level)}`} />
//                   <span>{device.battery_level ?? 0}%</span>
//                 </div>
//               </div>

//               <div className="flex space-x-2">
//                 {/* Edit */}
//                 <button
//                   className="p-2 bg-yellow-100 text-yellow-700 rounded-lg"
//                   onClick={() => setEditingDevice(device)}
//                 >
//                   <Pencil className="w-5 h-5" />
//                 </button>

//                 {/* Delete */}
//                 <button
//                   className="p-2 bg-red-100 text-red-700 rounded-lg"
//                   onClick={() => deleteDevice(device.id)}
//                 >
//                   <Trash2 className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Add Device Modal */}
//       {showAddModal && (
//         <AddDeviceModal
//           onClose={() => setShowAddModal(false)}
//           onSuccess={() => {
//             setShowAddModal(false);
//             loadDevices();
//           }}
//         />
//       )}

//       {/* Edit Device Modal */}
//       {editingDevice && (
//         <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-lg w-96 space-y-4">
//             <h2 className="text-xl font-semibold">Edit Device</h2>

//             <input
//               className="w-full border p-2 rounded"
//               value={editingDevice.device_name}
//               onChange={(e) =>
//                 setEditingDevice({ ...editingDevice, device_name: e.target.value })
//               }
//             />

//             <input
//               className="w-full border p-2 rounded"
//               value={editingDevice.device_model}
//               onChange={(e) =>
//                 setEditingDevice({ ...editingDevice, device_model: e.target.value })
//               }
//             />

//             <button
//               onClick={updateDevice}
//               className="w-full bg-blue-600 text-white py-2 rounded"
//             >
//               Update
//             </button>

//             <button
//               onClick={() => setEditingDevice(null)}
//               className="w-full bg-gray-300 py-2 rounded"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
