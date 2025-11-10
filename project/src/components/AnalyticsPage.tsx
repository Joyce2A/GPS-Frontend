import { useEffect, useState } from 'react';
import { TrendingUp, Activity, Zap, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Analytics {
  totalDistance: number;
  activeDevices: number;
  averageSpeed: number;
  totalAlerts: number;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics>({
    totalDistance: 1245,
    activeDevices: 0,
    averageSpeed: 35,
    totalAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deviceActivity, setDeviceActivity] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      const [devicesResult, alertsResult] = await Promise.all([
        supabase.from('devices').select('*').eq('user_id', user.id),
        supabase.from('alerts').select('*').eq('user_id', user.id),
      ]);

      if (devicesResult.data) {
        const devices = devicesResult.data;
        const onlineDevices = devices.filter(d => d.status === 'online');
        const avgSpeed = onlineDevices.length > 0
          ? onlineDevices.reduce((sum, d) => sum + (d.speed || 0), 0) / onlineDevices.length
          : 0;

        setAnalytics({
          totalDistance: 1245,
          activeDevices: onlineDevices.length,
          averageSpeed: Math.round(avgSpeed),
          totalAlerts: alertsResult.data?.length || 0,
        });

        setDeviceActivity(
          devices.map(d => ({
            name: d.name,
            status: d.status,
            battery: d.battery_level || 0,
            speed: d.speed || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      label: 'Total Distance Today',
      value: `${analytics.totalDistance} mi`,
      trend: '+12%',
      icon: Navigation,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Devices',
      value: `${analytics.activeDevices}`,
      trend: null,
      icon: Activity,
      color: 'bg-teal-500',
    },
    {
      label: 'Average Speed',
      value: `${analytics.averageSpeed} mph`,
      trend: null,
      icon: Zap,
      color: 'bg-amber-500',
    },
    {
      label: 'Total Alerts',
      value: `${analytics.totalAlerts}`,
      trend: '-8%',
      icon: TrendingUp,
      color: 'bg-red-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {card.trend && (
                  <div className={`text-sm font-medium ${
                    card.trend.startsWith('+') ? 'text-teal-600' : 'text-red-600'
                  }`}>
                    {card.trend}
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm text-gray-600">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Activity (24h)</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {Array.from({ length: 24 }).map((_, i) => {
              const height = Math.random() * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t relative overflow-hidden" style={{ height: '100%' }}>
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                  {i % 4 === 0 && (
                    <span className="text-xs text-gray-500 mt-2">{i}h</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Distribution</h3>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="20"
                  strokeDasharray="188.4 62.8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="20"
                  strokeDasharray="62.8 188.4"
                  strokeDashoffset="-188.4"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{analytics.activeDevices}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Offline</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Device Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Battery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deviceActivity.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No device data available
                  </td>
                </tr>
              ) : (
                deviceActivity.map((device, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{device.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        device.status === 'online'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              device.battery > 50 ? 'bg-teal-500' :
                              device.battery > 25 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${device.battery}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{device.battery}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {device.speed} mph
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
