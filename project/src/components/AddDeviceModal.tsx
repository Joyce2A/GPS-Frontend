import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

interface Device {
  id: string;
  device_id: string;
  device_name?: string;
  device_model?: string;
  battery_level?: number;
  device_status?: string;
}

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingDevice: Device | null;
}

export function AddDeviceModal({ isOpen, onClose, onSuccess, editingDevice }: AddDeviceModalProps) {
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [batteryLevel, setBatteryLevel] = useState<number | "">("");
  const [deviceStatus, setDeviceStatus] = useState("offline");
  const [error, setError] = useState("");

  const token = localStorage.getItem("auth_token");

  useEffect(() => {
    if (editingDevice) {
      setDeviceId(editingDevice.device_id);
      setDeviceName(editingDevice.device_name || "");
      setDeviceModel(editingDevice.device_model || "");
      setBatteryLevel(editingDevice.battery_level ?? "");
      setDeviceStatus(editingDevice.device_status || "offline");
    } else {
      resetForm();
    }
  }, [editingDevice]);

  const resetForm = () => {
    setDeviceId("");
    setDeviceName("");
    setDeviceModel("");
    setBatteryLevel("");
    setDeviceStatus("offline");
    setError("");
  };

  const closeModal = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Not authenticated");
      return;
    }

    try {
      const payload = {
        device_id: deviceId,
        device_name: deviceName,
        device_model: deviceModel,
        battery_level: batteryLevel === "" ? null : Number(batteryLevel),
        device_status: deviceStatus,
      };

      if (editingDevice) {
        // UPDATE
        await axios.put(`${API_BASE_URL}/devices/by-device/${editingDevice.device_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // CREATE
        await axios.post(`${API_BASE_URL}/devices`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onSuccess();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save device");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg space-y-4">
        <h2 className="text-xl font-bold">
          {editingDevice ? "Edit Device" : "Add Device"}
        </h2>

        {error && <p className="text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Device ID"
            required
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            disabled={!!editingDevice}
            className="border p-2 rounded w-full"
          />

          <input
            type="text"
            placeholder="Device Name"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <input
            type="text"
            placeholder="Device Model"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            className="border p-2 rounded w-full"
          />

          <input
            type="number"
            placeholder="Battery Level %"
            value={batteryLevel}
            min={0}
            max={100}
            onChange={(e) =>
              setBatteryLevel(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="border p-2 rounded w-full"
          />

          <select
            value={deviceStatus}
            onChange={(e) => setDeviceStatus(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="offline">Offline</option>
            <option value="online">Online</option>
            <option value="maintenance">Maintenance</option>
            <option value="error">Error</option>
          </select>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {editingDevice ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Device {
//   id: string;
//   device_id: string;
//   device_name?: string;
//   device_model?: string;
//   device_status?: string;
//   battery_level?: number;
// }

// interface AddDeviceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   editingDevice: Device | null;
// }

// export function AddDeviceModal({ isOpen, onClose, onSuccess, editingDevice }: AddDeviceModalProps) {
//   const [deviceId, setDeviceId] = useState("");
//   const [deviceName, setDeviceName] = useState("");
//   const [deviceModel, setDeviceModel] = useState("");
//   const [batteryLevel, setBatteryLevel] = useState<number | "">("");
//   const [deviceStatus, setDeviceStatus] = useState("offline");

//   const [error, setError] = useState("");

//   const token = localStorage.getItem("auth_token");

//   // -------- Load selected device when editing --------
//   useEffect(() => {
//     if (editingDevice) {
//       setDeviceId(editingDevice.device_id);
//       setDeviceName(editingDevice.device_name || "");
//       setDeviceModel(editingDevice.device_model || "");
//       setBatteryLevel(editingDevice.battery_level ?? "");
//       setDeviceStatus(editingDevice.device_status || "offline");
//     } else {
//       resetForm();
//     }
//   }, [editingDevice]);

//   const resetForm = () => {
//     setDeviceId("");
//     setDeviceName("");
//     setDeviceModel("");
//     setBatteryLevel("");
//     setDeviceStatus("offline");
//     setError("");
//   };

//   const closeModal = () => {
//     resetForm();
//     onClose();
//   };

//   // -------- SUBMIT: ADD or UPDATE --------
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (!token) {
//       setError("Not authenticated");
//       return;
//     }

//     try {
//       const payload = {
//         device_id: deviceId,
//         device_name: deviceName,
//         device_model: deviceModel,
//         battery_level: batteryLevel === "" ? null : Number(batteryLevel),
//         device_status: deviceStatus,
//       };

//       if (editingDevice) {
//         // UPDATE DEVICE
//         await axios.put(`${API_BASE_URL}/devices/${editingDevice.id}`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         // ADD DEVICE
//         await axios.post(`${API_BASE_URL}/devices`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       onSuccess();
//       closeModal();
//     } catch (err: any) {
//       setError(err.response?.data?.detail || "Failed to save device");
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10">
//       <div className="bg-white p-6 rounded-lg w-96 shadow-lg space-y-4">
//         <h2 className="text-xl font-bold">
//           {editingDevice ? "Edit Device" : "Add Device"}
//         </h2>

//         {error && <p className="text-red-500">{error}</p>}

//         <form onSubmit={handleSubmit} className="space-y-3">
//           <input
//             type="text"
//             placeholder="Device ID"
//             required
//             value={deviceId}
//             onChange={(e) => setDeviceId(e.target.value)}
//             className="border p-2 rounded w-full"
//           />

//           <input
//             type="text"
//             placeholder="Device Name"
//             value={deviceName}
//             onChange={(e) => setDeviceName(e.target.value)}
//             className="border p-2 rounded w-full"
//           />

//           <input
//             type="text"
//             placeholder="Device Model"
//             value={deviceModel}
//             onChange={(e) => setDeviceModel(e.target.value)}
//             className="border p-2 rounded w-full"
//           />

//           <input
//             type="number"
//             placeholder="Battery Level %"
//             value={batteryLevel}
//             min={0}
//             max={100}
//             onChange={(e) =>
//               setBatteryLevel(e.target.value === "" ? "" : Number(e.target.value))
//             }
//             className="border p-2 rounded w-full"
//           />

//           <select
//             value={deviceStatus}
//             onChange={(e) => setDeviceStatus(e.target.value)}
//             className="border p-2 rounded w-full"
//           >
//             <option value="offline">Offline</option>
//             <option value="online">Online</option>
//             <option value="maintenance">Maintenance</option>
//             <option value="error">Error</option>
//           </select>

//           <div className="flex justify-end gap-2">
//             <button
//               type="button"
//               onClick={closeModal}
//               className="px-4 py-2 border rounded"
//             >
//               Close
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded"
//             >
//               {editingDevice ? "Update" : "Add"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
// import { useState } from "react";
// import { Plus, Trash2, Pencil, Battery } from "lucide-react";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Device {
//   id: string;
//   device_id: string;
//   device_name?: string;
//   device_model?: string;
//   device_status?: string;
//   battery_level?: number;
// }

// interface AddDeviceModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   editingDevice?: Device | null;
// }

// export function AddDeviceModal({ isOpen, onClose, onSuccess, editingDevice }: AddDeviceModalProps) {
//   const [deviceId, setDeviceId] = useState(editingDevice?.device_id || "");
//   const [deviceName, setDeviceName] = useState(editingDevice?.device_name || "");
//   const [deviceModel, setDeviceModel] = useState(editingDevice?.device_model || "");
//   const [batteryLevel, setBatteryLevel] = useState<number | "">(editingDevice?.battery_level ?? "");
//   const [deviceStatus, setDeviceStatus] = useState(editingDevice?.device_status || "offline");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   if (!isOpen) return null;

//   const resetForm = () => {
//     setDeviceId("");
//     setDeviceName("");
//     setDeviceModel("");
//     setBatteryLevel("");
//     setDeviceStatus("offline");
//     setError("");
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const token = localStorage.getItem("auth_token");
//     if (!token) return setError("Not authenticated");

//     const payload = {
//       device_id: deviceId,
//       device_name: deviceName,
//       device_model: deviceModel,
//       battery_level: batteryLevel === "" ? null : Number(batteryLevel),
//       device_status: deviceStatus,
//     };

//     setLoading(true);
//     try {
//       if (editingDevice) {
//         await axios.put(`${API_BASE_URL}/devices/${editingDevice.id}`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         await axios.post(`${API_BASE_URL}/devices`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       resetForm();
//       onClose();
//       onSuccess(); // refresh parent device list
//     } catch (err: any) {
//       setError(err.response?.data?.detail || err.message || "Failed to save device");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
//       <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
//         <h2 className="text-xl font-bold">{editingDevice ? "Edit Device" : "Add Device"}</h2>
//         {error && <p className="text-red-500">{error}</p>}

//         <form onSubmit={handleSubmit} className="space-y-2">
//           <input
//             type="text"
//             placeholder="Device ID"
//             value={deviceId}
//             onChange={(e) => setDeviceId(e.target.value)}
//             required
//             className="border p-2 w-full rounded"
//           />
//           <input
//             type="text"
//             placeholder="Device Name"
//             value={deviceName}
//             onChange={(e) => setDeviceName(e.target.value)}
//             className="border p-2 w-full rounded"
//           />
//           <input
//             type="text"
//             placeholder="Device Model"
//             value={deviceModel}
//             onChange={(e) => setDeviceModel(e.target.value)}
//             className="border p-2 w-full rounded"
//           />
//           <input
//             type="number"
//             placeholder="Battery Level"
//             value={batteryLevel}
//             onChange={(e) => setBatteryLevel(e.target.value === "" ? "" : Number(e.target.value))}
//             min={0}
//             max={100}
//             className="border p-2 w-full rounded"
//           />
//           <select
//             value={deviceStatus}
//             onChange={(e) => setDeviceStatus(e.target.value)}
//             className="border p-2 w-full rounded"
//           >
//             <option value="offline">Offline</option>
//             <option value="online">Online</option>
//             <option value="maintenance">Maintenance</option>
//             <option value="error">Error</option>
//           </select>

//           <div className="flex justify-end gap-2 mt-2">
//             <button
//               type="button"
//               onClick={() => { resetForm(); onClose(); }}
//               className="px-4 py-2 border rounded hover:bg-gray-100"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             >
//               {loading ? "Saving..." : editingDevice ? "Update" : "Add"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { Plus, Trash2, Pencil, Battery } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";
// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

// interface AddDeviceModalProps {
//   onClose: () => void;
// }

// export function AddDeviceModal({ onClose }: AddDeviceModalProps) {
//   const { user } = useAuth();
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [editingDevice, setEditingDevice] = useState<Device | null>(null);

//   const [deviceId, setDeviceId] = useState("");
//   const [deviceName, setDeviceName] = useState("");
//   const [deviceModel, setDeviceModel] = useState("");
//   const [batteryLevel, setBatteryLevel] = useState<number | "">("");
//   const [deviceStatus, setDeviceStatus] = useState("offline");

//   const token = localStorage.getItem("auth_token");

//   // Load all devices for this user
//   const loadDevices = async () => {
//     if (!user) return;
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE_URL}/devices/?user_id=${user.id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       const mapped = data.map((d: any) => ({ id: d._id || d.id, ...d }));
//       setDevices(mapped);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadDevices();
//   }, [user]);

//   const resetForm = () => {
//     setDeviceId("");
//     setDeviceName("");
//     setDeviceModel("");
//     setBatteryLevel("");
//     setDeviceStatus("offline");
//     setEditingDevice(null);
//     setError("");
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!token) return setError("Not authenticated");

//     try {
//       const payload = {
//         device_id: deviceId,
//         device_name: deviceName,
//         device_model: deviceModel,
//         battery_level: batteryLevel === "" ? null : Number(batteryLevel),
//         device_status: deviceStatus,
//       };

//       if (editingDevice) {
//         // Update
//         await axios.put(`${API_BASE_URL}/devices/${editingDevice.id}`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         // Add
//         await axios.post(`${API_BASE_URL}/devices`, payload, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       resetForm();
//       loadDevices();
//     } catch (err: any) {
//       setError(err.response?.data?.detail || err.message || "Failed to save device");
//     }
//   };

//   const handleDelete = async (device: Device) => {
//     if (!token) return setError("Not authenticated");
//     if (!confirm(`Are you sure you want to delete "${device.device_name}"?`)) return;

//     try {
//       await axios.delete(`${API_BASE_URL}/devices/${device.id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       loadDevices();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const startEdit = (device: Device) => {
//     setEditingDevice(device);
//     setDeviceId(device.device_id);
//     setDeviceName(device.device_name);
//     setDeviceModel(device.device_model);
//     setBatteryLevel(device.battery_level ?? "");
//     setDeviceStatus(device.device_status);
//   };

//   const getBatteryColor = (level: number | null) => {
//     if (level === null) return "text-gray-400";
//     if (level > 50) return "text-green-600";
//     if (level > 25) return "text-amber-600";
//     return "text-red-600";
//   };

//   if (loading) return <div className="p-6">Loading devices...</div>;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-auto">
//       <div className="bg-white p-6 rounded-lg w-96 space-y-4">
//         <h2 className="text-xl font-bold">{editingDevice ? "Edit Device" : "Add Device"}</h2>
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

//           <div className="flex justify-end gap-2 mt-2">
//             <button type="button" onClick={() => { resetForm(); onClose(); }} className="px-4 py-2 border rounded">Close</button>
//             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingDevice ? "Update" : "Add"}</button>
//           </div>
//         </form>

//         <hr />

//         {/* Devices List */}
//         <div className="space-y-2 max-h-80 overflow-auto">
//           {devices.map((device) => (
//             <div key={device.id} className="flex justify-between items-center p-2 border rounded">
//               <div>
//                 <h3 className="font-semibold">{device.device_name}</h3>
//                 <p className="text-sm text-gray-500">{device.device_id}</p>
//                 <div className="flex items-center mt-1">
//                   <Battery className={`w-4 h-4 mr-1 ${getBatteryColor(device.battery_level)}`} />
//                   <span>{device.battery_level ?? 0}%</span>
//                 </div>
//               </div>
//               <div className="flex gap-1">
//                 <button onClick={() => startEdit(device)} className="p-1 bg-yellow-100 text-yellow-700 rounded"><Pencil className="w-4 h-4" /></button>
//                 <button onClick={() => handleDelete(device)} className="p-1 bg-red-100 text-red-700 rounded"><Trash2 className="w-4 h-4" /></button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


