// src/components/AddAssetModal.tsx

import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// --------------------------
// INTERFACES
// --------------------------
interface Asset {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  description?: string;
  registered_location: { latitude: number; longitude: number; radius: number };
}

interface Device {
  device_id: string;
  name?: string;
  status: string;
}

export function AddAssetModal({
  isOpen,
  onClose,
  onSuccess,
  editingAsset,
  viewAsset,
}: any) {
  const [formData, setFormData] = useState<Asset>({
    asset_id: "",
    asset_name: "",
    asset_type: "",
    description: "",
    registered_location: { latitude: 0, longitude: 0, radius: 0 },
  });

  const [devices, setDevices] = useState<Device[]>([]);
  const [linkedDevices, setLinkedDevices] = useState<Device[]>([]);
  const [linkModal, setLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({
    device_id: "",
    status: "active",
  });

  const token = localStorage.getItem("auth_token");

  // --------------------------
  // LOAD DEVICES
  // --------------------------
  const loadDevices = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(res.data || []);
    } catch {
      console.log("Device load failed");
    }
  };

  // --------------------------
  // LOAD LINKED DEVICES
  // --------------------------
  const loadLinkedDevices = async () => {
    if (!formData.asset_id) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/assets/${formData.asset_id}/devices`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const list = Array.isArray(res.data)
        ? res.data
        : res.data.linked_devices || [];

      setLinkedDevices(list);
    } catch {
      setLinkedDevices([]);
    }
  };

  // --------------------------
  // INITIAL LOAD
  // --------------------------
  useEffect(() => {
    if (editingAsset) setFormData(editingAsset);
    if (viewAsset) setFormData(viewAsset);

    loadDevices();
  }, [editingAsset, viewAsset]);

  useEffect(() => {
    loadLinkedDevices();
  }, [formData.asset_id]);

  if (!isOpen) return null;

  // --------------------------
  // SAVE ASSET
  // --------------------------
  const handleSave = async () => {
    if (!formData.asset_id || !formData.asset_name || !formData.asset_type) {
      alert("Asset ID, Name, and Type are required.");
      return;
    }

    try {
      const payload = {
        asset_id: formData.asset_id,
        asset_name: formData.asset_name,
        asset_type: formData.asset_type,
        description: formData.description || "",
        registered_location: {
          latitude: Number(formData.registered_location.latitude),
          longitude: Number(formData.registered_location.longitude),
          radius: Number(formData.registered_location.radius),
        },
      };

      if (editingAsset) {
        await axios.put(
          `${API_BASE_URL}/assets/by-asset/${formData.asset_id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${API_BASE_URL}/assets`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      alert("Asset saved successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.log(err.response?.data);
      alert("Save failed: " + JSON.stringify(err.response?.data, null, 2));
    }
  };

  // --------------------------
  // LINK DEVICE
  // --------------------------
  const linkDevice = async () => {
    if (!linkForm.device_id) {
      alert("Select a device first.");
      return;
    }

    if (linkedDevices.some((d) => d.device_id === linkForm.device_id)) {
      alert("Device already linked. Unlink first.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/assets/link-device`,
        {
          asset_id: formData.asset_id,
          device_id: linkForm.device_id,
          status: linkForm.status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      loadLinkedDevices();
      setLinkModal(false);
      alert("Device Linked!");
    } catch (err: any) {
      alert("Link failed: " + JSON.stringify(err.response?.data, null, 2));
    }
  };

  // --------------------------
  // UNLINK SINGLE DEVICE
  // --------------------------
  const unlinkDevice = async (device_id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/assets/unlink-device`, {
        params: { asset_id: formData.asset_id, device_id },
        headers: { Authorization: `Bearer ${token}` },
      });

      loadLinkedDevices();
      alert("Device Unlinked!");
    } catch (err: any) {
      alert("Unlink failed");
    }
  };

  // --------------------------
  // UNLINK ALL DEVICES
  // --------------------------
  const unlinkAllDevices = async () => {
    try {
      for (const d of linkedDevices) {
        await axios.delete(`${API_BASE_URL}/assets/unlink-device`, {
          params: { asset_id: formData.asset_id, device_id: d.device_id },
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      loadLinkedDevices();
      alert("All devices unlinked!");
    } catch (err: any) {
      alert("Unlink all failed");
    }
  };

  // --------------------------
  // VIEW MODE
  // --------------------------
  if (viewAsset) {
    return (
      <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
        <div className="bg-white p-6 rounded w-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Asset Details</h2>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <p>
            <b>ID:</b> {formData.asset_id}
          </p>
          <p>
            <b>Name:</b> {formData.asset_name}
          </p>
          <p>
            <b>Type:</b> {formData.asset_type}
          </p>
          <p>
            <b>Description:</b> {formData.description}
          </p>
          <p>
            <b>Latitude:</b> {formData.registered_location.latitude}
          </p>
          <p>
            <b>Longitude:</b> {formData.registered_location.longitude}
          </p>
          <p>
            <b>Radius:</b> {formData.registered_location.radius} m
          </p>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Linked Devices</h3>

            {linkedDevices.length === 0 && (
              <p className="text-sm text-gray-500">No devices linked</p>
            )}

            {linkedDevices.map((d) => (
              <div
                key={d.device_id}
                className="border p-2 rounded flex justify-between items-center mb-2"
              >
                <div>
                  <p>
                    <b>{d.device_id}</b>
                  </p>
                  <p>Status: {d.status}</p>
                </div>

                <button
                  onClick={() => unlinkDevice(d.device_id)}
                  className="text-red-600 border px-2 py-1 rounded"
                >
                  Unlink
                </button>
              </div>
            ))}

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setLinkModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Link Device
              </button>

              <button
                onClick={unlinkAllDevices}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Unlink All
              </button>
            </div>
          </div>

          <div className="mt-6 text-right">
            <button onClick={onClose} className="px-4 py-2 border rounded">
              Close
            </button>
          </div>

          {/* LINK DEVICE POPUP */}
          {linkModal && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
              <div className="bg-white p-4 rounded w-[350px]">
                <h3 className="font-semibold mb-3">Link Device</h3>

                <label>Device ID:</label>
                <select
                  className="w-full border p-2 mb-3"
                  value={linkForm.device_id}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, device_id: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id}
                    </option>
                  ))}
                </select>

                <label>Status:</label>
                <select
                  className="w-full border p-2 mb-3"
                  value={linkForm.status}
                  onChange={(e) =>
                    setLinkForm({ ...linkForm, status: e.target.value })
                  }
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setLinkModal(false)}
                    className="px-3 py-1 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={linkDevice}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------
  // ADD / EDIT MODE
  // --------------------------
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editingAsset ? "Edit Asset" : "Add Asset"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <input
          placeholder="Asset ID"
          className="border w-full p-2 mb-2"
          value={formData.asset_id}
          onChange={(e) =>
            setFormData({ ...formData, asset_id: e.target.value })
          }
        />

        <input
          placeholder="Name"
          className="border w-full p-2 mb-2"
          value={formData.asset_name}
          onChange={(e) =>
            setFormData({ ...formData, asset_name: e.target.value })
          }
        />

        <input
          placeholder="Type"
          className="border w-full p-2 mb-2"
          value={formData.asset_type}
          onChange={(e) =>
            setFormData({ ...formData, asset_type: e.target.value })
          }
        />

        <textarea
          placeholder="Description"
          className="border w-full p-2 mb-2"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <input
          placeholder="Latitude"
          className="border w-full p-2 mb-2"
          value={formData.registered_location.latitude}
          onChange={(e) =>
            setFormData({
              ...formData,
              registered_location: {
                ...formData.registered_location,
                latitude: parseFloat(e.target.value),
              },
            })
          }
        />

        <input
          placeholder="Longitude"
          className="border w-full p-2 mb-2"
          value={formData.registered_location.longitude}
          onChange={(e) =>
            setFormData({
              ...formData,
              registered_location: {
                ...formData.registered_location,
                longitude: parseFloat(e.target.value),
              },
            })
          }
        />

        <input
          placeholder="Radius (m)"
          className="border w-full p-2 mb-4"
          value={formData.registered_location.radius}
          onChange={(e) =>
            setFormData({
              ...formData,
              registered_location: {
                ...formData.registered_location,
                radius: parseFloat(e.target.value),
              },
            })
          }
        />

        <div className="text-right">
          <button onClick={onClose} className="px-4 py-2 border rounded mr-2">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { X } from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// // --------------------------
// // INTERFACES
// // --------------------------
// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: { latitude: number; longitude: number };
//   radius?: number;
// }

// interface Device {
//   device_id: string;
//   name?: string;
//   status: string;
// }

// export function AddAssetModal({ isOpen, onClose, onSuccess, editingAsset, viewAsset }: any) {
//   const [formData, setFormData] = useState<Asset>({
//     asset_id: "",
//     asset_name: "",
//     asset_type: "",
//     registered_location: { latitude: 0, longitude: 0 },
//     radius: 0
//   });

//   const [devices, setDevices] = useState<Device[]>([]);
//   const [linkedDevices, setLinkedDevices] = useState<Device[]>([]);
//   const [linkModal, setLinkModal] = useState(false);
//   const [linkForm, setLinkForm] = useState({ device_id: "", status: "active" });

//   const token = localStorage.getItem("auth_token");

//   // --------------------------
//   // LOAD DEVICES
//   // --------------------------
//   const loadDevices = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setDevices(res.data || []);
//     } catch {
//       console.log("Device load failed");
//     }
//   };

//   // --------------------------
//   // LOAD LINKED DEVICES
//   // --------------------------
//   const loadLinkedDevices = async () => {
//     if (!formData.asset_id) return;
//     try {
//       const res = await axios.get(`${API_BASE_URL}/assets/${formData.asset_id}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const list = Array.isArray(res.data)
//         ? res.data
//         : res.data.linked_devices || [];

//       setLinkedDevices(list);
//     } catch {
//       console.log("Linked device load failed");
//       setLinkedDevices([]);
//     }
//   };

//   // --------------------------
//   // INITIAL LOAD
//   // --------------------------
//   useEffect(() => {
//     if (editingAsset) setFormData(editingAsset);
//     if (viewAsset) setFormData(viewAsset);
//     loadDevices();
//   }, [editingAsset, viewAsset]);

//   useEffect(() => {
//     loadLinkedDevices();
//   }, [formData.asset_id]);

//   if (!isOpen) return null;

//   // --------------------------
//   // SAVE ASSET
//   // --------------------------
//   const handleSave = async () => {
//     if (!formData.asset_id || !formData.asset_name || !formData.asset_type) {
//       alert("Asset ID, Name, and Type are required.");
//       return;
//     }

//     try {
//       const payload = {
//         asset_id: formData.asset_id,
//         asset_name: formData.asset_name,
//         asset_type: formData.asset_type,
//         description: formData.description || "",
//         registered_location: {
//           latitude: Number(formData.registered_location.latitude),
//           longitude: Number(formData.registered_location.longitude)
//         },
//         radius: formData.radius ? Number(formData.radius) : undefined
//       };

//       if (editingAsset) {
//         await axios.put(
//           `${API_BASE_URL}/assets/by-asset/${formData.asset_id}`,
//           payload,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       } else {
//         await axios.post(
//           `${API_BASE_URL}/assets`,
//           payload,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       }

//       alert("Asset saved successfully!");
//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       console.log(err.response?.data);
//       alert(
//         "Save failed: " + JSON.stringify(err.response?.data, null, 2)
//       );
//     }
//   };

//   // --------------------------
//   // LINK DEVICE
//   // --------------------------
//   const linkDevice = async () => {
//     if (!linkForm.device_id) {
//       alert("Select a device first.");
//       return;
//     }

//     if (linkedDevices.some((d) => d.device_id === linkForm.device_id)) {
//       alert("Device already linked. Unlink first.");
//       return;
//     }

//     try {
//       await axios.post(
//         `${API_BASE_URL}/assets/link-device`,
//         {
//           asset_id: formData.asset_id,
//           device_id: linkForm.device_id,
//           status: linkForm.status,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       loadLinkedDevices();
//       setLinkModal(false);
//       alert("Device Linked!");
//     } catch (err: any) {
//       console.log(err.response?.data);
//       alert("Link failed: " + JSON.stringify(err.response?.data, null, 2));
//     }
//   };

//   // --------------------------
//   // UNLINK SINGLE DEVICE
//   // --------------------------
//   const unlinkDevice = async (device_id: string) => {
//     try {
//       await axios.delete(
//         `${API_BASE_URL}/assets/unlink-device`,
//         {
//           params: { asset_id: formData.asset_id, device_id },
//           headers: { Authorization: `Bearer ${token}` }
//         }
//       );

//       loadLinkedDevices();
//       alert("Device Unlinked!");
//     } catch (err: any) {
//       console.log(err.response?.data);
//       alert("Unlink failed: " + JSON.stringify(err.response?.data, null, 2));
//     }
//   };

//   // --------------------------
//   // UNLINK ALL DEVICES
//   // --------------------------
//   const unlinkAllDevices = async () => {
//     try {
//       for (const d of linkedDevices) {
//         await axios.delete(
//           `${API_BASE_URL}/assets/unlink-device`,
//           {
//             params: { asset_id: formData.asset_id, device_id: d.device_id },
//             headers: { Authorization: `Bearer ${token}` }
//           }
//         );
//       }

//       loadLinkedDevices();
//       alert("All devices unlinked!");
//     } catch (err: any) {
//       console.log(err.response?.data);
//       alert("Unlink all failed: " + JSON.stringify(err.response?.data, null, 2));
//     }
//   };

//   // --------------------------
//   // VIEW MODE
//   // --------------------------
//   if (viewAsset) {
//     return (
//       <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//         <div className="bg-white p-6 rounded w-[500px]">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold">Asset Details</h2>
//             <button onClick={onClose}><X /></button>
//           </div>

//           <p><b>ID:</b> {formData.asset_id}</p>
//           <p><b>Name:</b> {formData.asset_name}</p>
//           <p><b>Type:</b> {formData.asset_type}</p>
//           <p><b>Description:</b> {formData.description}</p>
//           <p><b>Latitude:</b> {formData.registered_location.latitude}</p>
//           <p><b>Longitude:</b> {formData.registered_location.longitude}</p>
//           <p><b>Radius:</b> {formData.radius} m</p>

//           <div className="mt-4">
//             <h3 className="font-semibold mb-2">Linked Devices</h3>

//             {linkedDevices.length === 0 && (
//               <p className="text-sm text-gray-500">No devices linked</p>
//             )}

//             {linkedDevices.map((d) => (
//               <div
//                 key={d.device_id}
//                 className="border p-2 rounded flex justify-between items-center mb-2"
//               >
//                 <div>
//                   <p><b>{d.device_id}</b></p>
//                   <p>Status: {d.status}</p>
//                 </div>

//                 <button
//                   onClick={() => unlinkDevice(d.device_id)}
//                   className="text-red-600 border px-2 py-1 rounded"
//                 >
//                   Unlink
//                 </button>
//               </div>
//             ))}

//             <div className="flex gap-3 mt-3">
//               <button
//                 onClick={() => setLinkModal(true)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded"
//               >
//                 Link Device
//               </button>

//               <button
//                 onClick={unlinkAllDevices}
//                 className="px-4 py-2 bg-red-600 text-white rounded"
//               >
//                 Unlink All
//               </button>
//             </div>
//           </div>

//           <div className="mt-6 text-right">
//             <button onClick={onClose} className="px-4 py-2 border rounded">
//               Close
//             </button>
//           </div>

//           {/* LINK DEVICE POPUP */}
//           {linkModal && (
//             <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//               <div className="bg-white p-4 rounded w-[350px]">
//                 <h3 className="font-semibold mb-3">Link Device</h3>

//                 <label>Device ID:</label>
//                 <select
//                   className="w-full border p-2 mb-3"
//                   value={linkForm.device_id}
//                   onChange={(e) =>
//                     setLinkForm({ ...linkForm, device_id: e.target.value })
//                   }
//                 >
//                   <option value="">Select</option>
//                   {devices.map((d) => (
//                     <option key={d.device_id} value={d.device_id}>
//                       {d.device_id}
//                     </option>
//                   ))}
//                 </select>

//                 <label>Status:</label>
//                 <select
//                   className="w-full border p-2 mb-3"
//                   value={linkForm.status}
//                   onChange={(e) =>
//                     setLinkForm({ ...linkForm, status: e.target.value })
//                   }
//                 >
//                   <option value="active">active</option>
//                   <option value="inactive">inactive</option>
//                 </select>

//                 <div className="flex justify-end gap-2">
//                   <button
//                     onClick={() => setLinkModal(false)}
//                     className="px-3 py-1 border rounded"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={linkDevice}
//                     className="px-3 py-1 bg-blue-600 text-white rounded"
//                   >
//                     Link
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>
//     );
//   }

//   // --------------------------
//   // ADD / EDIT MODE
//   // --------------------------
//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//       <div className="bg-white p-6 rounded w-[500px]">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">
//             {editingAsset ? "Edit Asset" : "Add Asset"}
//           </h2>
//           <button onClick={onClose}><X /></button>
//         </div>

//         <input
//           placeholder="Asset ID"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_id}
//           onChange={(e) =>
//             setFormData({ ...formData, asset_id: e.target.value })
//           }
//         />

//         <input
//           placeholder="Name"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_name}
//           onChange={(e) =>
//             setFormData({ ...formData, asset_name: e.target.value })
//           }
//         />

//         <input
//           placeholder="Type"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_type}
//           onChange={(e) =>
//             setFormData({ ...formData, asset_type: e.target.value })
//           }
//         />

//         <textarea
//           placeholder="Description"
//           className="border w-full p-2 mb-2"
//           value={formData.description}
//           onChange={(e) =>
//             setFormData({ ...formData, description: e.target.value })
//           }
//         />

//         <input
//           placeholder="Latitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.latitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 latitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Longitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.longitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 longitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Radius (m)"
//           className="border w-full p-2 mb-4"
//           value={formData.radius}
//           onChange={(e) =>
//             setFormData({ ...formData, radius: parseFloat(e.target.value) })
//           }
//         />

//         <div className="text-right">
//           <button onClick={onClose} className="px-4 py-2 border rounded mr-2">
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 bg-blue-600 text-white rounded"
//           >
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { X } from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// // --------------------------
// // INTERFACES
// // --------------------------
// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: { latitude: number; longitude: number };
//   radius?: number;
// }

// interface Device {
//   device_id: string;
//   name: string;
//   status: string;
// }

// export function AddAssetModal({ isOpen, onClose, onSuccess, editingAsset, viewAsset }: any) {
//   const [formData, setFormData] = useState<Asset>({
//     asset_id: "",
//     asset_name: "",
//     asset_type: "",
//     registered_location: { latitude: 0, longitude: 0 },
//     radius: 0,
//   });

//   const [devices, setDevices] = useState<Device[]>([]);
//   const [linkedDevices, setLinkedDevices] = useState<Device[]>([]);
//   //const [unlinkedDevices, setLinkedDevices] = useState<Device[]>([]);
//   const [linkModal, setLinkModal] = useState(false);
//   const [linkForm, setLinkForm] = useState({ device_id: "", status: "active" });

//   const token = localStorage.getItem("auth_token");

//   // --------------------------
//   // LOAD DEVICES
//   // --------------------------
//   const loadDevices = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setDevices(res.data || []);
//     } catch (e) {
//       console.log("Device load failed");
//     }
//   };

//   // --------------------------
//   // LOAD LINKED DEVICES
//   // --------------------------
//   const loadLinkedDevices = async () => {
//     if (!formData.asset_id) return;

//     try {
//       const res = await axios.get(`${API_BASE_URL}/assets/${formData.asset_id}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setLinkedDevices(res.data || []);
//     } catch {
//       console.log("Linked device load failed");
//     }
//   };

//   // --------------------------
//   // INITIAL DATA
//   // --------------------------
//   useEffect(() => {
//     if (editingAsset) setFormData(editingAsset);
//     if (viewAsset) setFormData(viewAsset);

//     loadDevices();
//   }, [editingAsset, viewAsset]);

//   useEffect(() => {
//     loadLinkedDevices();
//   }, [formData.asset_id]);

//   if (!isOpen) return null;

//   // --------------------------
//   // SAVE ASSET
//   // --------------------------
//   const handleSave = async () => {
//     try {
//       if (editingAsset) {
//         await axios.put(`${API_BASE_URL}/assets/by-asset/${formData.asset_id}`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         await axios.post(`${API_BASE_URL}/assets`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       onSuccess();
//       onClose();
//     } catch {
//       alert("Save failed");
//     }
//   };

//   // --------------------------
//   // LINK DEVICE
//   // --------------------------
//   const linkDevice = async () => {
//     // prevent duplicate
//     if (linkedDevices.some((d) => d.device_id === linkForm.device_id)) {
//       alert("Device already linked. Unlink first.");
//       return;
//     }

//     try {
//       await axios.post(
//         `${API_BASE_URL}/assets/link-device`,
//         {
//           asset_id: formData.asset_id,
//           device_id: linkForm.device_id,
//           status: linkForm.status,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       loadLinkedDevices();
//       setLinkModal(false);
//       alert("Device linked!");
//     } catch (err: any) {
//       alert("Link failed");
//     }
//   };

//   // --------------------------
//   // UNLINK DEVICE
//   // --------------------------
//   const unlinkDevice = async (device_id: string) => {
//     try {
//       await axios.post(
//         `${API_BASE_URL}/assets/unlink-device`,
//         {
//           asset_id: formData.asset_id,
//           device_id,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       loadLinkedDevices();
//       alert("Device unlinked!");
//     } catch {
//       alert("Unlink failed");
//     }
//   };

//   // --------------------------
//   // VIEW MODE
//   // --------------------------
//   if (viewAsset) {
//     return (
//       <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//         <div className="bg-white p-6 rounded w-[500px]">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold">Asset Details</h2>
//             <button onClick={onClose}>
//               <X />
//             </button>
//           </div>

//           <p><b>ID:</b> {formData.asset_id}</p>
//           <p><b>Name:</b> {formData.asset_name}</p>
//           <p><b>Type:</b> {formData.asset_type}</p>
//           <p><b>Description:</b> {formData.description}</p>
//           <p><b>Latitude:</b> {formData.registered_location.latitude}</p>
//           <p><b>Longitude:</b> {formData.registered_location.longitude}</p>
//           <p><b>Radius:</b> {formData.radius} m</p>

//           <div className="mt-4">
//             <h3 className="font-semibold mb-2">Linked Devices</h3>

//             {(!Array.isArray(linkedDevices) || linkedDevices.length === 0) && (
//               <p className="text-sm text-gray-500 mb-2">No devices linked</p>
//             )}

//             {Array.isArray(linkedDevices) &&
//               linkedDevices.map((d) => (
//                 <div
//                   key={d.device_id}
//                   className="border p-2 rounded flex justify-between items-center mb-2"
//                 >
//                   <div>
//                     <p><b>{d.device_id}</b></p>
//                     <p>Status: {d.status}</p>
//                   </div>

//                   <button
//                     onClick={() => unlinkDevice(d.device_id)}
//                     className="text-red-600 border px-2 py-1 rounded"
//                   >
//                     Unlink
//                   </button>
//                 </div>
//               ))}

//             {devices.length > 0 && (
//   <div className="flex gap-2 mt-2">
//     <button
//       onClick={() => setLinkModal(true)}
//       className="px-4 py-2 bg-blue-600 text-white rounded"
//     >
//       Link Device
//     </button>

//     {linkedDevices.length > 0 && (
//       <button
//         onClick={unlinkDevice}
//         className="px-4 py-2 bg-red-600 text-white rounded"
//       >
//         Unlink
//       </button>
//     )}
//   </div>
// )}
//           </div>

//           <div className="mt-6 text-right">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 border rounded"
//             >
//               Close
//             </button>
//           </div>

//           {/* LINK MODAL */}
//           {linkModal && (
//             <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//               <div className="bg-white p-4 rounded w-[350px]">
//                 <h3 className="font-semibold mb-3">Link Device</h3>

//                 <label>Device ID:</label>
//                 <select
//                   className="w-full border p-2 mb-3"
//                   value={linkForm.device_id}
//                   onChange={(e) =>
//                     setLinkForm({ ...linkForm, device_id: e.target.value })
//                   }
//                 >
//                   <option>Select</option>
//                   {devices.map((d) => (
//                     <option key={d.device_id} value={d.device_id}>
//                       {d.device_id}
//                     </option>
//                   ))}
//                 </select>

//                 <label>Status:</label>
//                 <select
//                   className="w-full border p-2 mb-3"
//                   value={linkForm.status}
//                   onChange={(e) =>
//                     setLinkForm({ ...linkForm, status: e.target.value })
//                   }
//                 >
//                   <option value="active">active</option>
//                   <option value="inactive">inactive</option>
//                 </select>

//                 <div className="flex justify-end gap-2">
//                   <button
//                     onClick={() => setLinkModal(false)}
//                     className="px-3 py-1 border rounded"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={linkDevice}
//                     className="px-3 py-1 bg-blue-600 text-white rounded"
//                   >
//                     Link
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // --------------------------
//   // ADD / EDIT MODE
//   // --------------------------
//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//       <div className="bg-white p-6 rounded w-[500px]">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">
//             {editingAsset ? "Edit Asset" : "Add Asset"}
//           </h2>
//           <button onClick={onClose}>
//             <X />
//           </button>
//         </div>

//         {/* Form */}
//         <input
//           placeholder="Asset ID"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_id}
//           onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
//         />

//         <input
//           placeholder="Name"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_name}
//           onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
//         />

//         <input
//           placeholder="Type"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_type}
//           onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
//         />

//         <textarea
//           placeholder="Description"
//           className="border w-full p-2 mb-2"
//           value={formData.description}
//           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//         />

//         <input
//           placeholder="Latitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.latitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 latitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Longitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.longitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 longitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Radius (m)"
//           className="border w-full p-2 mb-4"
//           value={formData.radius}
//           onChange={(e) =>
//             setFormData({ ...formData, radius: parseFloat(e.target.value) })
//           }
//         />

//         <div className="text-right">
//           <button onClick={onClose} className="px-4 py-2 border rounded mr-2">
//             Cancel
//           </button>
//           <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { X } from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: { latitude: number; longitude: number };
//   radius?: number;
// }

// interface Device {
//   device_id: string;
//   name: string;
//   status: string;
// }

// export function AddAssetModal({ isOpen, onClose, onSuccess, editingAsset, viewAsset }: any) {
//   const [formData, setFormData] = useState<Asset>({
//     asset_id: "",
//     asset_name: "",
//     asset_type: "",
//     registered_location: { latitude: 0, longitude: 0 },
//     radius: 0,
//   });

//   const [devices, setDevices] = useState<Device[]>([]);
//   const [linkedDevices, setLinkedDevices] = useState<Device[]>([]);
//   const [linkModal, setLinkModal] = useState(false);
//   const [linkForm, setLinkForm] = useState({ device_id: "", status: "active" });

//   const token = localStorage.getItem("auth_token");

//   // LOAD DEVICES
//   const loadDevices = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setDevices(res.data || []);
//     } catch {}
//   };

//   // LOAD LINKED DEVICES
//   const loadLinkedDevices = async () => {
//     if (!formData.asset_id) return;
//     try {
//       const res = await axios.get(`${API_BASE_URL}/assets/${formData.asset_id}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setLinkedDevices(res.data || []);
//     } catch {}
//   };

//   useEffect(() => {
//     if (editingAsset) setFormData(editingAsset);
//     if (viewAsset) setFormData(viewAsset);

//     loadDevices();
//   }, [editingAsset, viewAsset]);

//   useEffect(() => {
//     loadLinkedDevices();
//   }, [formData.asset_id]);

//   if (!isOpen) return null;

//   // SAVE
//   const handleSave = async () => {
//     try {
//       if (editingAsset) {
//         await axios.put(`${API_BASE_URL}/assets/by-asset/${formData.asset_id}`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         await axios.post(`${API_BASE_URL}/assets`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }
//       onSuccess();
//       onClose();
//     } catch {
//       alert("Save failed");
//     }
//   };

//   // LINK DEVICE
//   const linkDevice = async () => {
//     if (linkedDevices.some((d) => d.device_id === linkForm.device_id)) {
//       alert("Device already linked.");
//       return;
//     }

//     try {
//       await axios.post(
//         `${API_BASE_URL}/assets/link-device`,
//         {
//           asset_id: formData.asset_id,
//           device_id: linkForm.device_id,
//           status: linkForm.status,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       loadLinkedDevices();
//       setLinkModal(false);
//     } catch {
//       alert("Link failed");
//     }
//   };

//   // UNLINK DEVICE
//   const unlinkDevice = async (device_id: string) => {
//     try {
//       await axios.post(
//         `${API_BASE_URL}/assets/unlink-device`,
//         {
//           asset_id: formData.asset_id,
//           device_id,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       loadLinkedDevices();
//     } catch {
//       alert("Unlink failed");
//     }
//   };

//   // VIEW MODE
//   if (viewAsset) {
//     return (
//       <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//         <div className="bg-white p-6 rounded w-[500px]">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold">Asset Details</h2>
//             <button onClick={onClose}><X /></button>
//           </div>

//           <p><b>ID:</b> {formData.asset_id}</p>
//           <p><b>Name:</b> {formData.asset_name}</p>
//           <p><b>Type:</b> {formData.asset_type}</p>
//           <p><b>Description:</b> {formData.description}</p>
//           <p><b>Latitude:</b> {formData.registered_location.latitude}</p>
//           <p><b>Longitude:</b> {formData.registered_location.longitude}</p>
//           <p><b>Radius:</b> {formData.radius} m</p>

//           {/* LINKED DEVICES */}
//           <div className="mt-4">
//             <h3 className="font-semibold mb-2">Linked Devices</h3>

//             {linkedDevices.length === 0 && (
//               <p className="text-sm text-gray-500 mb-2">No devices linked</p>
//             )}

//             {linkedDevices.map((d) => (
//               <div key={d.device_id} className="border p-2 rounded flex justify-between mb-2">
//                 <div>
//                   <p><b>{d.device_id}</b></p>
//                   <p>Status: {d.status}</p>
//                 </div>

//                 {/* ONLY THIS BUTTON */}
//                 <button
//                   onClick={() => unlinkDevice(d.device_id)}
//                   className="text-red-600 border px-2 py-1 rounded"
//                 >
//                   Unlink
//                 </button>
//               </div>
//             ))}

//             <button
//               onClick={() => setLinkModal(true)}
//               className="px-4 py-2 bg-blue-600 text-white rounded mt-2"
//             >
//               Link Device
//             </button>
//           </div>

//           {/* CLOSE */}
//           <div className="mt-6 text-right">
//             <button onClick={onClose} className="px-4 py-2 border rounded">
//               Close
//             </button>
//           </div>

//           {/* LINK MODAL */}
//           {linkModal && (
//             <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//               <div className="bg-white p-4 rounded w-[350px]">
//                 <h3 className="font-semibold mb-3">Link Device</h3>

//                 <label>Device ID:</label>
//                 <select
//                   className="w-full border p-2 mb-3"
//                   value={linkForm.device_id}
//                   onChange={(e) => setLinkForm({ ...linkForm, device_id: e.target.value })}
//                 >
//                   <option>Select</option>
//                   {devices.map((d) => (
//                     <option key={d.device_id} value={d.device_id}>{d.device_id}</option>
//                   ))}
//                 </select>

//                 <label>Status:</label>
//                 <select
//                   className="w-full border p-2 mb-3"
//                   value={linkForm.status}
//                   onChange={(e) => setLinkForm({ ...linkForm, status: e.target.value })}
//                 >
//                   <option value="active">active</option>
//                   <option value="inactive">inactive</option>
//                 </select>

//                 <div className="flex justify-end gap-2">
//                   <button onClick={() => setLinkModal(false)} className="px-3 py-1 border rounded">
//                     Cancel
//                   </button>
//                   <button onClick={linkDevice} className="px-3 py-1 bg-blue-600 text-white rounded">
//                     Link
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // ADD / EDIT MODE
//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//       <div className="bg-white p-6 rounded w-[500px]">
//         {/* HEADER */}
//         <div className="flex justify-between mb-4">
//           <h2 className="text-xl font-semibold">
//             {editingAsset ? "Edit Asset" : "Add Asset"}
//           </h2>
//           <button onClick={onClose}><X /></button>
//         </div>

//         {/* FORM */}
//         <input
//           placeholder="Asset ID"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_id}
//           onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
//         />

//         <input
//           placeholder="Name"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_name}
//           onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
//         />

//         <input
//           placeholder="Type"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_type}
//           onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
//         />

//         <textarea
//           placeholder="Description"
//           className="border w-full p-2 mb-2"
//           value={formData.description}
//           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//         />

//         <input
//           placeholder="Latitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.latitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 latitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Longitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.longitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 longitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Radius (m)"
//           className="border w-full p-2 mb-4"
//           value={formData.radius}
//           onChange={(e) =>
//             setFormData({ ...formData, radius: parseFloat(e.target.value) })
//           }
//         />

//         <div className="text-right">
//           <button onClick={onClose} className="px-4 py-2 border rounded mr-2">
//             Cancel
//           </button>
//           <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// import { useEffect, useState } from "react";
// import axios from "axios";
// import { X } from "lucide-react";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: { latitude: number; longitude: number };
//   radius?: number;
// }

// interface Device {
//   device_id: string;
//   name: string;
//   status: string;
// }

// export function AddAssetModal({ isOpen, onClose, onSuccess, editingAsset, viewAsset }: any) {
//   const [formData, setFormData] = useState<Asset>({
//     asset_id: "",
//     asset_name: "",
//     asset_type: "",
//     registered_location: { latitude: 0, longitude: 0 },
//     radius: 0,
//   });

//   const [devices, setDevices] = useState<Device[]>([]);
//   const [linkedDevices, setLinkedDevices] = useState<Device[]>([]);
//   const [linkModal, setLinkModal] = useState(false);
//   const [linkForm, setLinkForm] = useState({ device_id: "", status: "active" });

//   const token = localStorage.getItem("auth_token");

//   // --------------------------------
//   // LOAD DEVICES (safe array fallback)
//   // --------------------------------
//   const loadDevices = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setDevices(Array.isArray(res.data) ? res.data : []);
//     } catch {
//       setDevices([]);
//     }
//   };

//   // --------------------------------
//   // LOAD LINKED DEVICES (safe fallback)
//   // --------------------------------
//   const loadLinkedDevices = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/assets/${formData.asset_id}/devices`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setLinkedDevices(Array.isArray(res.data) ? res.data : []);
//     } catch {
//       setLinkedDevices([]);
//     }
//   };

//   useEffect(() => {
//     if (editingAsset) setFormData(editingAsset);
//     if (viewAsset) setFormData(viewAsset);
//     loadDevices();
//   }, [editingAsset, viewAsset]);

//   useEffect(() => {
//     if (formData.asset_id) {
//       loadLinkedDevices();
//     }
//   }, [formData.asset_id]);

//   if (!isOpen) return null;

//   // -------------------
//   // SAVE OR UPDATE
//   // -------------------
//   const handleSave = async () => {
//     try {
//       if (editingAsset) {
//         await axios.put(
//           `${API_BASE_URL}/assets/by-asset/${formData.asset_id}`,
//           formData,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       } else {
//         await axios.post(`${API_BASE_URL}/assets`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }
//       onSuccess();
//       onClose();
//     } catch {
//       alert("Save failed");
//     }
//   };

//   // -------------------
//   // LINK DEVICE
//   // -------------------
//   const linkDevice = async () => {
//     try {
//       await axios.post(
//         `${API_BASE_URL}/assets/link-device`,
//         {
//           asset_id: formData.asset_id,
//           device_id: linkForm.device_id,
//           status: linkForm.status,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       loadLinkedDevices();
//       setLinkModal(false);
//     } catch {
//       alert("Link failed");
//     }
//   };

//   // -------------------
//   // UNLINK DEVICE
//   // -------------------
//   const unlinkDevice = async (device_id: string) => {
//     try {
//       await axios.post(
//         `${API_BASE_URL}/assets/unlink-device`,
//         {
//           asset_id: formData.asset_id,
//           device_id,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       loadLinkedDevices();
//     } catch {
//       alert("Unlink failed");
//     }
//   };

//   // -------------------
//   // VIEW MODE
//   // -------------------
//   if (viewAsset) {
//     return (
//       <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//         <div className="bg-white p-6 rounded w-[500px]">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold">Asset Details</h2>
//             <button onClick={onClose}>
//               <X />
//             </button>
//           </div>

//           <p><b>ID:</b> {formData.asset_id}</p>
//           <p><b>Name:</b> {formData.asset_name}</p>
//           <p><b>Type:</b> {formData.asset_type}</p>
//           <p><b>Description:</b> {formData.description}</p>
//           <p><b>Latitude:</b> {formData.registered_location.latitude}</p>
//           <p><b>Longitude:</b> {formData.registered_location.longitude}</p>
//           <p><b>Radius:</b> {formData.radius} m</p>

//           <div className="mt-4">
//             <h3 className="font-semibold mb-2">Linked Devices</h3>

//             {!Array.isArray(linkedDevices) || linkedDevices.length === 0 ? (
//               <p className="text-sm text-gray-500 mb-2">No devices linked</p>
//             ) : (
//               linkedDevices.map((d) => (
//                 <div
//                   key={d.device_id}
//                   className="border p-2 rounded flex justify-between items-center mb-2"
//                 >
//                   <div>
//                     <p><b>{d.device_id}</b></p>
//                     <p>Status: {d.status}</p>
//                   </div>

//                   <button
//                     onClick={() => unlinkDevice(d.device_id)}
//                     className="text-red-600"
//                   >
//                     Unlink
//                   </button>
//                 </div>
//               ))
//             )}

//             <button
//               onClick={() => setLinkModal(true)}
//               className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
//             >
//               Link Device
//             </button>
//           </div>
//         </div>

//         {/* LINK MODAL */}
//         {linkModal && (
//           <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//             <div className="bg-white p-4 rounded w-[350px]">
//               <h3 className="font-semibold mb-3">Link Device</h3>

//               <label>Device ID:</label>
//               <select
//                 className="w-full border p-2 mb-3"
//                 value={linkForm.device_id}
//                 onChange={(e) => setLinkForm({ ...linkForm, device_id: e.target.value })}
//               >
//                 <option>Select</option>
//                 {devices.map((d) => (
//                   <option key={d.device_id} value={d.device_id}>
//                     {d.device_id}
//                   </option>
//                 ))}
//               </select>

//               <label>Status:</label>
//               <select
//                 className="w-full border p-2 mb-3"
//                 value={linkForm.status}
//                 onChange={(e) => setLinkForm({ ...linkForm, status: e.target.value })}
//               >
//                 <option value="active">active</option>
//                 <option value="inactive">inactive</option>
//               </select>

//               <div className="flex justify-end gap-2">
//                 <button onClick={() => setLinkModal(false)} className="px-3 py-1 border rounded">
//                   Cancel
//                 </button>
//                 <button onClick={linkDevice} className="px-3 py-1 bg-blue-600 text-white rounded">
//                   Link
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }

//   // -------------------
//   // ADD/EDIT MODE
//   // -------------------
//   return (
//     <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
//       <div className="bg-white p-6 rounded w-[500px]">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">
//             {editingAsset ? "Edit Asset" : "Add Asset"}
//           </h2>
//           <button onClick={onClose}>
//             <X />
//           </button>
//         </div>

//         {/* FORM */}
//         <input
//           placeholder="Asset ID"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_id}
//           onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
//         />

//         <input
//           placeholder="Name"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_name}
//           onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
//         />

//         <input
//           placeholder="Type"
//           className="border w-full p-2 mb-2"
//           value={formData.asset_type}
//           onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
//         />

//         <textarea
//           placeholder="Description"
//           className="border w-full p-2 mb-2"
//           value={formData.description}
//           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//         />

//         <input
//           placeholder="Latitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.latitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 latitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Longitude"
//           className="border w-full p-2 mb-2"
//           value={formData.registered_location.longitude}
//           onChange={(e) =>
//             setFormData({
//               ...formData,
//               registered_location: {
//                 ...formData.registered_location,
//                 longitude: parseFloat(e.target.value),
//               },
//             })
//           }
//         />

//         <input
//           placeholder="Radius (m)"
//           className="border w-full p-2 mb-4"
//           value={formData.radius}
//           onChange={(e) => setFormData({ ...formData, radius: parseFloat(e.target.value) })}
//         />

//         <div className="text-right">
//           <button onClick={onClose} className="px-4 py-2 border rounded mr-2">
//             Cancel
//           </button>
//           <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// import { useState, useEffect } from "react";
// import { X, Loader2 } from "lucide-react";
// import axios from "axios";

// interface AddAssetModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   editingAsset?: Asset | null;
// }

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: {
//     latitude: number;
//     longitude: number;
//     radius?: number;
//   };
// }

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// export function AddAssetModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   editingAsset,
// }: AddAssetModalProps) {
//   const [formData, setFormData] = useState<Asset>({
//     asset_id: "",
//     asset_name: "",
//     asset_type: "",
//     description: "",
//     registered_location: { latitude: 0, longitude: 0, radius: 0 },
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (editingAsset) {
//       setFormData({
//         asset_id: editingAsset.asset_id,
//         asset_name: editingAsset.asset_name,
//         asset_type: editingAsset.asset_type,
//         description: editingAsset.description || "",
//         registered_location: {
//           latitude: editingAsset.registered_location.latitude,
//           longitude: editingAsset.registered_location.longitude,
//           radius: editingAsset.registered_location.radius ?? 0,
//         },
//       });
//     } else {
//       setFormData({
//         asset_id: "",
//         asset_name: "",
//         asset_type: "",
//         description: "",
//         registered_location: { latitude: 0, longitude: 0, radius: 0 },
//       });
//     }
//   }, [editingAsset, isOpen]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       if (editingAsset) {
//         const payload: any = {};
//         if (formData.asset_name) payload.asset_name = formData.asset_name;
//         if (formData.asset_type) payload.asset_type = formData.asset_type;
//         if (formData.description !== undefined)
//           payload.description = formData.description;
//         if (formData.registered_location) {
//           payload.registered_location = {
//             latitude: Number(formData.registered_location.latitude),
//             longitude: Number(formData.registered_location.longitude),
//             radius: Number(formData.registered_location.radius),
//           };
//         }

//         await axios.put(
//           `${API_BASE_URL}/assets/by-asset/${editingAsset.asset_id}`,
//           payload,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       } else {
//         await axios.post(`${API_BASE_URL}/assets`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       console.error("Asset error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to save");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
//         <button
//           onClick={onClose}
//           className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
//         >
//           <X className="w-5 h-5" />
//         </button>

//         <div className="p-6">
//           <h2 className="text-2xl font-bold mb-6">
//             {editingAsset ? "Edit Asset" : "Add Asset"}
//           </h2>

//           {error && (
//             <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* ID */}
//             <div>
//               <label className="font-medium">Asset ID *</label>
//               <input
//                 type="text"
//                 required
//                 disabled={!!editingAsset}
//                 className="w-full px-3 py-2 border rounded bg-gray-100"
//                 value={formData.asset_id}
//                 onChange={(e) =>
//                   setFormData({ ...formData, asset_id: e.target.value })
//                 }
//               />
//             </div>

//             {/* Name */}
//             <div>
//               <label className="font-medium">Asset Name *</label>
//               <input
//                 required
//                 className="w-full px-3 py-2 border rounded"
//                 value={formData.asset_name}
//                 onChange={(e) =>
//                   setFormData({ ...formData, asset_name: e.target.value })
//                 }
//               />
//             </div>

//             {/* Type */}
//             <div>
//               <label className="font-medium">Asset Type *</label>
//               <input
//                 required
//                 className="w-full px-3 py-2 border rounded"
//                 value={formData.asset_type}
//                 onChange={(e) =>
//                   setFormData({ ...formData, asset_type: e.target.value })
//                 }
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="font-medium">Description</label>
//               <textarea
//                 rows={3}
//                 className="w-full px-3 py-2 border rounded"
//                 value={formData.description}
//                 onChange={(e) =>
//                   setFormData({ ...formData, description: e.target.value })
//                 }
//               />
//             </div>

//             {/* Location */}
//             <div className="grid grid-cols-3 gap-3">
//               <input
//                 placeholder="Latitude"
//                 type="number"
//                 required
//                 value={formData.registered_location.latitude}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     registered_location: {
//                       ...formData.registered_location,
//                       latitude: parseFloat(e.target.value),
//                     },
//                   })
//                 }
//               />
//               <input
//                 placeholder="Longitude"
//                 type="number"
//                 required
//                 value={formData.registered_location.longitude}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     registered_location: {
//                       ...formData.registered_location,
//                       longitude: parseFloat(e.target.value),
//                     },
//                   })
//                 }
//               />
//               <input
//                 placeholder="Radius"
//                 type="number"
//                 required
//                 value={formData.registered_location.radius}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     registered_location: {
//                       ...formData.registered_location,
//                       radius: parseFloat(e.target.value),
//                     },
//                   })
//                 }
//               />
//             </div>

//             {/* Buttons */}
//             <div className="flex gap-3 pt-3">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="w-1/2 border rounded py-2"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-1/2 bg-blue-600 text-white rounded py-2 flex justify-center"
//               >
//                 {loading ? (
//                   <Loader2 className="animate-spin" />
//                 ) : editingAsset ? (
//                   "Update"
//                 ) : (
//                   "Add"
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { X, Loader2 } from "lucide-react";
// import axios from "axios";

// interface AddAssetModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   editingAsset?: Asset | null;
// }

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: {
//     latitude: number;
//     longitude: number;
//     radius?: number;
//   };
// }

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// export function AddAssetModal({ isOpen, onClose, onSuccess, editingAsset }: AddAssetModalProps) {
//   const [formData, setFormData] = useState<Asset>({
//     asset_id: "",
//     asset_name: "",
//     asset_type: "",
//     description: "",
//     registered_location: { latitude: 0, longitude: 0, radius: 0 },
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (editingAsset) {
//       setFormData({
//         asset_id: editingAsset.asset_id,
//         asset_name: editingAsset.asset_name,
//         asset_type: editingAsset.asset_type,
//         description: editingAsset.description || "",
//         registered_location: {
//           latitude: editingAsset.registered_location.latitude,
//           longitude: editingAsset.registered_location.longitude,
//           radius: editingAsset.registered_location.radius ?? 0,
//         },
//       });
//     } else {
//       setFormData({
//         asset_id: "",
//         asset_name: "",
//         asset_type: "",
//         description: "",
//         registered_location: { latitude: 0, longitude: 0, radius: 0 },
//       });
//     }
//   }, [editingAsset, isOpen]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       if (editingAsset) {
//         // Prepare payload for backend (exclude asset_id)
//         const payload: any = {};
//         if (formData.asset_name) payload.asset_name = formData.asset_name;
//         if (formData.asset_type) payload.asset_type = formData.asset_type;
//         if (formData.description !== undefined) payload.description = formData.description;
//         if (formData.registered_location) {
//           payload.registered_location = {
//             latitude: Number(formData.registered_location.latitude),
//             longitude: Number(formData.registered_location.longitude),
//             radius: Number(formData.registered_location.radius),
//           };
//         }

//         await axios.put(
//           `${API_BASE_URL}/assets/by-asset/${editingAsset.asset_id}`,
//           payload,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       } else {
//         // Add new asset
//         await axios.post(
//           `${API_BASE_URL}/assets`,
//           formData,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       }

//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       console.error("Asset save error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to save asset");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
//         <button
//           onClick={onClose}
//           className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition z-10"
//         >
//           <X className="w-5 h-5" />
//         </button>

//         <div className="p-6">
//           <h2 className="text-2xl font-bold mb-6 text-gray-800">
//             {editingAsset ? "Edit Asset" : "Add New Asset"}
//           </h2>

//           {error && (
//             <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Asset ID */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Asset ID <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 disabled={!!editingAsset}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 disabled:cursor-not-allowed"
//                 value={formData.asset_id}
//                 onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
//                 placeholder="e.g., ASSET001"
//               />
//             </div>

//             {/* Asset Name */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Asset Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={formData.asset_name}
//                 onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
//                 placeholder="e.g., Delivery Van #1"
//               />
//             </div>

//             {/* Asset Type */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Asset Type <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={formData.asset_type}
//                 onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
//                 placeholder="e.g., Vehicle, Container, Equipment"
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 rows={3}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={formData.description}
//                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                 placeholder="Additional details about the asset"
//               />
//             </div>

//             {/* Location */}
//             <div className="grid grid-cols-3 gap-3">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Latitude <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   step="any"
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={formData.registered_location.latitude}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       registered_location: {
//                         ...formData.registered_location,
//                         latitude: parseFloat(e.target.value),
//                       },
//                     })
//                   }
//                   placeholder="e.g., 40.7128"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Longitude <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   step="any"
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={formData.registered_location.longitude}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       registered_location: {
//                         ...formData.registered_location,
//                         longitude: parseFloat(e.target.value),
//                       },
//                     })
//                   }
//                   placeholder="e.g., -74.0060"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Radius (meters) <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   step="any"
//                   min={0}
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={formData.registered_location.radius}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       registered_location: {
//                         ...formData.registered_location,
//                         radius: parseFloat(e.target.value),
//                       },
//                     })
//                   }
//                   placeholder="e.g., 50"
//                 />
//               </div>
//             </div>

//             {/* Buttons */}
//             <div className="flex gap-3 pt-4">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
//               >
//                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingAsset ? "Save Changes" : "Add Asset"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { X, Loader2 } from "lucide-react";
// import axios from "axios";

// interface AddAssetModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   editingAsset?: Asset | null;
// }

// interface Asset {
//   asset_id: string;
//   asset_name: string;
//   asset_type: string;
//   description?: string;
//   registered_location: {
//     latitude: number;
//     longitude: number;
//     radius?: number;
//   };
// }

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// export function AddAssetModal({ isOpen, onClose, onSuccess, editingAsset }: AddAssetModalProps) {
//   const [formData, setFormData] = useState<Asset>({
//     asset_id: "",
//     asset_name: "",
//     asset_type: "",
//     description: "",
//     registered_location: { latitude: 0, longitude: 0, radius: 0 },
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (editingAsset) {
//       setFormData({
//         asset_id: editingAsset.asset_id,
//         asset_name: editingAsset.asset_name,
//         asset_type: editingAsset.asset_type,
//         description: editingAsset.description || "",
//         registered_location: {
//           latitude: editingAsset.registered_location.latitude,
//           longitude: editingAsset.registered_location.longitude,
//           radius: editingAsset.registered_location.radius ?? 0,
//         },
//       });
//     } else {
//       setFormData({
//         asset_id: "",
//         asset_name: "",
//         asset_type: "",
//         description: "",
//         registered_location: { latitude: 0, longitude: 0, radius: 0 },
//       });
//     }
//   }, [editingAsset, isOpen]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("Not authenticated");

//       if (editingAsset) {
//         // Edit existing asset
//         await axios.put(
//           `${API_BASE_URL}/assets/by-asset/${editingAsset.asset_id}`,
//           formData,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       } else {
//         // Add new asset
//         await axios.post(
//           `${API_BASE_URL}/assets`,
//           formData,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//       }

//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       console.error("Asset save error:", err);
//       setError(err.response?.data?.detail || err.message || "Failed to save asset");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
//         <button
//           onClick={onClose}
//           className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition z-10"
//         >
//           <X className="w-5 h-5" />
//         </button>

//         <div className="p-6">
//           <h2 className="text-2xl font-bold mb-6 text-gray-800">
//             {editingAsset ? "Edit Asset" : "Add New Asset"}
//           </h2>

//           {error && (
//             <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Asset ID */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Asset ID <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 disabled={!!editingAsset}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 disabled:cursor-not-allowed"
//                 value={formData.asset_id}
//                 onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
//                 placeholder="e.g., ASSET001"
//               />
//             </div>

//             {/* Asset Name */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Asset Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={formData.asset_name}
//                 onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
//                 placeholder="e.g., Delivery Van #1"
//               />
//             </div>

//             {/* Asset Type */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Asset Type <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={formData.asset_type}
//                 onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
//                 placeholder="e.g., Vehicle, Container, Equipment"
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 rows={3}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 value={formData.description}
//                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                 placeholder="Additional details about the asset"
//               />
//             </div>

//             {/* Location */}
//             <div className="grid grid-cols-3 gap-3">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Latitude <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   step="any"
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={formData.registered_location.latitude}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       registered_location: {
//                         ...formData.registered_location,
//                         latitude: parseFloat(e.target.value),
//                       },
//                     })
//                   }
//                   placeholder="e.g., 40.7128"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Longitude <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   step="any"
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={formData.registered_location.longitude}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       registered_location: {
//                         ...formData.registered_location,
//                         longitude: parseFloat(e.target.value),
//                       },
//                     })
//                   }
//                   placeholder="e.g., -74.0060"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Radius (meters) <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   step="any"
//                   min={0}
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   value={formData.registered_location.radius}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       registered_location: {
//                         ...formData.registered_location,
//                         radius: parseFloat(e.target.value),
//                       },
//                     })
//                   }
//                   placeholder="e.g., 50"
//                 />
//               </div>
//             </div>

//             {/* Buttons */}
//             <div className="flex gap-3 pt-4">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
//               >
//                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingAsset ? "Save Changes" : "Add Asset"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

