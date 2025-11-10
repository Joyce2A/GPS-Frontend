import { useEffect, useState } from 'react';
import { Plus, Package, Truck, Building, Container, Link as LinkIcon, Unlink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AddAssetModal } from './AddAssetModal';
import { LinkDeviceModal } from './LinkDeviceModal';

interface Asset {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  description: string | null;
  status: string;
}

interface Device {
  id: string;
  device_id: string;
  name: string;
  status: string;
}

interface AssetWithDevice extends Asset {
  linkedDevice?: Device;
}

export function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<AssetWithDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    loadAssets();
  }, [user]);

  const loadAssets = async () => {
    if (!user) return;

    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;

      const { data: linksData, error: linksError } = await supabase
        .from('device_asset_links')
        .select(`
          asset_id,
          devices:device_id (
            id,
            device_id,
            name,
            status
          )
        `)
        .eq('user_id', user.id)
        .is('unlinked_at', null);

      if (linksError) throw linksError;

      const assetsWithDevices = (assetsData || []).map(asset => {
        const link = linksData?.find((l: any) => l.asset_id === asset.id);
        return {
          ...asset,
          linkedDevice: link?.devices as Device | undefined,
        };
      });

      setAssets(assetsWithDevices);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlinkDevice = async (assetId: string) => {
    if (!confirm('Are you sure you want to unlink this device?')) return;

    try {
      const { error } = await supabase
        .from('device_asset_links')
        .update({ unlinked_at: new Date().toISOString() })
        .eq('asset_id', assetId)
        .is('unlinked_at', null);

      if (error) throw error;
      loadAssets();
    } catch (error) {
      console.error('Error unlinking device:', error);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return Truck;
      case 'equipment': return Package;
      case 'container': return Container;
      case 'building': return Building;
      default: return Package;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-teal-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Assets</h2>
          <p className="text-gray-600 mt-1">Manage your trackable assets and device assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Asset</span>
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets yet</h3>
          <p className="text-gray-600 mb-6">Create your first asset to start tracking</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const Icon = getAssetIcon(asset.type);
            return (
              <div key={asset.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                      <p className="text-sm text-gray-500">{asset.asset_id}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(asset.status)}`}></div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium text-gray-900 capitalize">{asset.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-gray-900 capitalize">{asset.status}</span>
                  </div>
                  {asset.description && (
                    <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                      {asset.description}
                    </p>
                  )}
                </div>

                {asset.linkedDevice ? (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-teal-900">Linked Device</span>
                      <div className={`w-2 h-2 rounded-full ${
                        asset.linkedDevice.status === 'online' ? 'bg-teal-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <p className="text-sm font-medium text-teal-900">{asset.linkedDevice.name}</p>
                    <p className="text-xs text-teal-700">{asset.linkedDevice.device_id}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-center">
                    <p className="text-xs text-gray-600">No device linked</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {asset.linkedDevice ? (
                    <button
                      onClick={() => unlinkDevice(asset.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center justify-center"
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setShowLinkModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium flex items-center justify-center"
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Link Device
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadAssets();
          }}
        />
      )}

      {showLinkModal && selectedAsset && (
        <LinkDeviceModal
          asset={selectedAsset}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedAsset(null);
          }}
          onSuccess={() => {
            setShowLinkModal(false);
            setSelectedAsset(null);
            loadAssets();
          }}
        />
      )}
    </div>
  );
}
