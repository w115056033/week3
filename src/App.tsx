import { useState, useEffect } from 'react';
import WeatherMap from './components/WeatherMap';
import WeatherOverlay from './components/WeatherOverlay';
import { fetchWeather, type StationData } from './api';

function App() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);

  useEffect(() => {
    const loadStations = async () => {
      const data = await fetchWeather();
      setStations(data);
    };
    loadStations();

    const interval = setInterval(loadStations, 600000); // 10 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <WeatherMap
        stations={stations}
        onSelectStation={setSelectedStation}
      />
      <WeatherOverlay
        station={selectedStation}
        totalStations={stations.length}
      />
    </div>
  );
}

export default App;
