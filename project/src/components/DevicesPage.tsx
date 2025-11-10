import { useEffect, useState } from 'react';
import { Plus, Search, Grid3x3, List, Battery, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AddDeviceModal } from './AddDeviceModal';

const API_BASE = "https://your-backend-url"; // ✅ change only this

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  device_model: string;
  device_status: string;
  battery_level: number | null;
  latitude: number | null;
  longitude: number | null;
  last_seen: string | null;
  user_id: string;
}

export function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadDevices();
  }, [user]);

  useEffect(() => {
    filterDevices();
  }, [devices, filterStatus, searchQuery]);

  const loadDevices = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/devices?user_id=${user.id}`, {
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch devices");
      const data = await res.json();
      setDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterDevices = () => {
    let filtered = devices;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.device_status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(d =>
        d.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDevices(filtered);
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/devices/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.id}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete device");
      setDevices(devices.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting device:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-teal-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (level: number | null) => {
    if (!level) return 'text-gray-400';
    if (level > 50) return 'text-teal-600';
    if (level > 25) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Search + View + Add */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Device</span>
        </button>
      </div>

      {/* Device List */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No devices found</h3>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredDevices.map((device) => (
            <div key={device.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(device.device_status)}`}></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{device.device_name}</h3>
                    <p className="text-sm text-gray-500">{device.device_id}</p>
                  </div>
                </div>

                <button
                  onClick={() => deleteDevice(device.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <Battery className={`w-4 h-4 mr-2 ${getBatteryColor(device.battery_level)}`} />
                  <span className="font-medium text-gray-900">{device.battery_level || 0}%</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadDevices();
          }}
        />
      )}
    </div>
  );
}

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
