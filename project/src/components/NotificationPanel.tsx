import { useEffect, useState } from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  category: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'warning',
      category: 'device',
      message: 'Device offline',
      acknowledged: false,
      created_at: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    try {
      // TODO: Replace with actual API calls when backend is ready
      setLoading(true);
      // Mock data for now
      setAlerts([
        {
          id: '1',
          type: 'warning',
          category: 'device',
          message: 'Device offline: Device 3',
          acknowledged: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (id: string) => {
    try {
      setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const clearAll = async () => {
    try {
      setAlerts(alerts.map(a => ({ ...a, acknowledged: true })));
    } catch (error) {
      console.error('Error clearing alerts:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col mt-16">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {alerts.filter(a => !a.acknowledged).length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No notifications</p>
              <p className="text-sm text-gray-500 text-center mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-gray-50 transition ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          alert.type === 'critical' ? 'bg-red-100 text-red-700' :
                          alert.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.type}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{alert.category}</span>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {alerts.filter(a => !a.acknowledged).length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={clearAll}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
