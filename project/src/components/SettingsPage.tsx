import { useState } from 'react';
import { User, Bell, Shield, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={user?.id || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Alert Types</p>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-red-500">🔴</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Critical Alerts</p>
                  <p className="text-xs text-gray-600">Battery critical, device offline</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.criticalAlerts}
                onChange={(e) => setNotifications({ ...notifications, criticalAlerts: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-amber-500">🟡</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Warning Alerts</p>
                  <p className="text-xs text-gray-600">Low battery, maintenance needed</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.warningAlerts}
                onChange={(e) => setNotifications({ ...notifications, warningAlerts: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-blue-500">🔵</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Info Alerts</p>
                  <p className="text-xs text-gray-600">General updates and notifications</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifications.infoAlerts}
                onChange={(e) => setNotifications({ ...notifications, infoAlerts: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            Change Password
          </button>
          <button className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
            Enable Two-Factor Authentication
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Data & Privacy</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <button className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
            Export My Data
          </button>
          <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
            Delete Account
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          Save Changes
        </button>
      </div>
    </div>
  );
}
