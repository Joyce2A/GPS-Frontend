import { supabase } from '../lib/supabase';

export async function seedSampleData(userId: string) {
  try {
    const sampleDevices = [
      {
        device_id: 'GPS-001',
        name: 'Delivery Truck Alpha',
        status: 'online',
        battery_level: 85,
        latitude: 40.7128,
        longitude: -74.0060,
        speed: 45,
        user_id: userId,
      },
      {
        device_id: 'GPS-002',
        name: 'Service Van Beta',
        status: 'online',
        battery_level: 92,
        latitude: 40.7589,
        longitude: -73.9851,
        speed: 30,
        user_id: userId,
      },
      {
        device_id: 'GPS-003',
        name: 'Fleet Car Gamma',
        status: 'offline',
        battery_level: 15,
        latitude: 40.7480,
        longitude: -73.9862,
        speed: 0,
        user_id: userId,
      },
    ];

    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .insert(sampleDevices)
      .select();

    if (devicesError) throw devicesError;

    const sampleAssets = [
      {
        asset_id: 'TRUCK-001',
        name: 'Delivery Truck #1',
        type: 'vehicle',
        description: 'Main delivery vehicle for downtown routes',
        status: 'active',
        user_id: userId,
      },
      {
        asset_id: 'VAN-001',
        name: 'Service Van #1',
        type: 'vehicle',
        description: 'Service vehicle for maintenance calls',
        status: 'active',
        user_id: userId,
      },
    ];

    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .insert(sampleAssets)
      .select();

    if (assetsError) throw assetsError;

    if (devices && devices.length > 0 && assets && assets.length > 0) {
      await supabase.from('device_asset_links').insert({
        device_id: devices[0].id,
        asset_id: assets[0].id,
        user_id: userId,
      });
    }

    const sampleAlerts = [
      {
        device_id: devices?.[2]?.id,
        type: 'critical',
        category: 'battery',
        message: 'Device GPS-003 battery critically low at 15%',
        user_id: userId,
      },
      {
        device_id: devices?.[0]?.id,
        type: 'info',
        category: 'maintenance',
        message: 'Device GPS-001 maintenance scheduled for next week',
        user_id: userId,
      },
    ];

    await supabase.from('alerts').insert(sampleAlerts);

    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
}
