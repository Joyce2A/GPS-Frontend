import { useState, useEffect } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Device {
  id: string;
  device_id: string;
  name: string;
  status: string;
  battery_level: number | null;
}

interface LinkDeviceModalProps {
  asset: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkDeviceModal({ asset, onClose, onSuccess }: LinkDeviceModalProps) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAvailableDevices();
  }, [user]);

  const loadAvailableDevices = async () => {
    if (!user) return;

    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id);

      if (devicesError) throw devicesError;

      const { data: linksData, error: linksError } = await supabase
        .from('device_asset_links')
        .select('device_id')
        .eq('user_id', user.id)
        .is('unlinked_at', null);

      if (linksError) throw linksError;

      const linkedDeviceIds = linksData?.map((l: any) => l.device_id) || [];
      const availableDevices = (devicesData || []).filter(
        d => !linkedDeviceIds.includes(d.id)
      );

      setDevices(availableDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedDevice || !user) return;

    setSubmitting(true);
    setError('');

    try {
      const { error: linkError } = await supabase.from('device_asset_links').insert({
        device_id: selectedDevice,
        asset_id: asset.id,
        user_id: user.id,
      });

      if (linkError) throw linkError;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link device');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.device_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-teal-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900">Link Device</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Select a device to link with <span className="font-medium">{asset.name}</span>
          </p>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No available devices found</p>
              <p className="text-sm text-gray-500 mt-2">
                All your devices are already linked or you need to add devices first
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device.id)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedDevice === device.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-500">{device.device_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Battery</span>
                    <span className="font-medium text-gray-900">
                      {device.battery_level || 0}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedDevice || submitting}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Linking...
              </>
            ) : (
              'Link Device'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
