import { useEffect, useState } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers, X, Battery, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Device {
  id: string;
  device_id: string;
  name: string;
  status: string;
  battery_level: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  last_seen: string | null;
}

export function MapPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showOffline, setShowOffline] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    loadDevices();
  }, [user]);

  const loadDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setDevices(data || []);

      if (data && data.length > 0) {
        const deviceWithLocation = data.find(d => d.latitude && d.longitude);
        if (deviceWithLocation) {
          setMapCenter({
            lat: deviceWithLocation.latitude!,
            lng: deviceWithLocation.longitude!
          });
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(device => {
    if (!device.latitude || !device.longitude) return false;
    if (!showOnline && device.status === 'online') return false;
    if (!showOffline && device.status === 'offline') return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-teal-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-200px)] bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-blue-600" />
          <input
            type="text"
            placeholder="Search location or device..."
            className="outline-none text-sm w-64"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.min(zoom + 1, 18))}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 1, 3))}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded transition">
            <Layers className="w-5 h-5 text-gray-700" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded transition">
            <Navigation className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="absolute top-20 left-4 z-10 w-80 bg-white rounded-lg shadow-lg max-h-[calc(100vh-320px)] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Devices</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnline}
                onChange={(e) => setShowOnline(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">Online</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOffline}
                onChange={(e) => setShowOffline(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">Offline</span>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredDevices.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm">No devices to display</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full p-3 rounded-lg border text-left transition ${
                    selectedDevice?.id === device.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{device.name}</p>
                      <p className="text-xs text-gray-500">{device.device_id}</p>
                    </div>
                  </div>
                  {device.speed !== null && device.speed > 0 && (
                    <p className="text-xs text-gray-600">Moving at {device.speed} mph</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedDevice && (
        <div className="absolute top-20 right-4 z-10 w-80 bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Device Details</h3>
            <button
              onClick={() => setSelectedDevice(null)}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedDevice.status)}`}></div>
                <span className="text-sm font-medium text-gray-700 capitalize">{selectedDevice.status}</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900">{selectedDevice.name}</h4>
              <p className="text-sm text-gray-600">{selectedDevice.device_id}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 flex items-center">
                  <Battery className="w-4 h-4 mr-2" />
                  Battery
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedDevice.battery_level || 0}%
                </span>
              </div>

              {selectedDevice.speed !== null && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Navigation className="w-4 h-4 mr-2" />
                    Speed
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedDevice.speed} mph
                  </span>
                </div>
              )}

              {selectedDevice.last_seen && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Last Update
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(selectedDevice.last_seen).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {selectedDevice.latitude && selectedDevice.longitude && (
                <div className="py-2">
                  <span className="text-sm text-gray-600 flex items-center mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    Current Location
                  </span>
                  <p className="text-xs font-mono text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                View History
              </button>
              <button className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-full bg-gray-400"
              style={{ left: `${(i + 1) * 5}%` }}
            ></div>
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-px w-full bg-gray-400"
              style={{ top: `${(i + 1) * 5}%` }}
            ></div>
          ))}
        </div>

        {filteredDevices.map((device) => {
          const x = ((device.longitude! + 180) / 360) * 100;
          const y = ((90 - device.latitude!) / 180) * 100;

          return (
            <button
              key={device.id}
              onClick={() => setSelectedDevice(device)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`w-6 h-6 rounded-full ${getStatusColor(device.status)} shadow-lg flex items-center justify-center border-2 border-white animate-pulse`}>
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                {device.name}
              </div>
            </button>
          );
        })}

        {filteredDevices.length === 0 && (
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No devices with location data</p>
            <p className="text-sm text-gray-500 mt-2">Add devices and update their locations to see them on the map</p>
          </div>
        )}
      </div>
    </div>
  );
}
