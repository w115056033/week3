import { useState, useEffect } from 'react';
import WeatherMap from './components/WeatherMap';
import WeatherOverlay from './components/WeatherOverlay';
import { fetchWeather, type StationData } from './api';
import type { WeatherMetric } from './components/WeatherMap';

function App() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [metric, setMetric] = useState<WeatherMetric>('temperature');
  const [locateRequest, setLocateRequest] = useState<{ lat: number; lon: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStations = async () => {
      const data = await fetchWeather();
      setStations(data);
      setLastUpdated(new Date());
      setLoading(false);
    };
    loadStations();

    const interval = setInterval(loadStations, 600000); // 10 mins
    return () => clearInterval(interval);
  }, []);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocateRequest({ lat: coords.latitude, lon: coords.longitude });
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <WeatherMap
        stations={stations}
        onSelectStation={setSelectedStation}
        metric={metric}
        locateRequest={locateRequest}
      />
      <WeatherOverlay
        station={selectedStation}
        totalStations={stations.length}
        stations={stations}
        metric={metric}
        onMetricChange={setMetric}
        onLocate={locateUser}
        lastUpdated={lastUpdated}
        loading={loading}
      />
    </div>
  );
}

export default App;
