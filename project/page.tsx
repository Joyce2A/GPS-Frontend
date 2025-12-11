import { MapPage } from '@/components/map-page';

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Asset Location Map</h1>
          <p className="text-gray-600 mt-1">Track and manage your assets on an interactive map</p>
        </div>
        <MapPage />
      </div>
    </main>
  );
}
