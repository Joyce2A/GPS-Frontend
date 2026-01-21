import { useEffect, useState } from 'react';
import { Activity, Cpu, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  activeAlerts: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    activeAlerts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // TODO: Replace with actual API calls when backend is ready
      // For now, using mock data
      setStats({
        totalDevices: 12,
        onlineDevices: 8,
        offlineDevices: 4,
        activeAlerts: 3,
      });

      setRecentActivity([
        { id: '1', type: 'alert', message: 'Device offline', created_at: new Date().toISOString() },
        { id: '2', type: 'alert', message: 'Low battery', created_at: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Devices',
      value: stats.totalDevices,
      icon: Cpu,
      color: 'bg-blue-500',
      trend: null,
    },
    {
      label: 'Online',
      value: stats.onlineDevices,
      icon: Activity,
      color: 'bg-teal-500',
      trend: null,
    },
    {
      label: 'Offline',
      value: stats.offlineDevices,
      icon: AlertCircle,
      color: 'bg-gray-500',
      trend: null,
    },
    {
      label: 'Active Alerts',
      value: stats.activeAlerts,
      icon: AlertCircle,
      color: 'bg-red-500',
      trend: null,
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">
          Good morning! 👋
        </h3>
        <p className="text-blue-700">
          {stats.activeAlerts > 0
            ? `${stats.activeAlerts} device${stats.activeAlerts > 1 ? 's' : ''} need${stats.activeAlerts === 1 ? 's' : ''} attention`
            : 'All systems running smoothly'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {card.trend && (
                  <div className="flex items-center text-teal-600 text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{card.trend}</span>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'critical' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Add New Device
            </button>
            <button className="w-full px-4 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition font-medium">
              View Live Map
            </button>
            <button className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
            <span className="text-sm font-medium text-teal-900">Database</span>
            <span className="text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">Healthy ✓</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
            <span className="text-sm font-medium text-teal-900">API</span>
            <span className="text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">Connected ✓</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
            <span className="text-sm font-medium text-teal-900">Last Update</span>
            <span className="text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
