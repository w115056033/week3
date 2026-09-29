import { useState, useEffect, useMemo } from 'react';
import WeatherMap from './components/WeatherMap';
import WeatherOverlay from './components/WeatherOverlay';
import ForecastPanel from './components/ForecastPanel';
import { fetchWeather, stationsForRegion, type StationData } from './api';
import { fetchForecast, loadCachedCoords, saveCachedCoords, type ForecastMarker, type RegionCoord } from './forecast';
import {
  deleteForecastsBefore,
  queryForecastDates,
  queryForecastStats,
  queryForecasts,
  queryRegions,
  saveForecasts,
  type TemperatureForecastRow,
} from './db';
import type { WeatherMetric } from './components/WeatherMap';

/** 每 30 分鐘重新抓取一次氣溫預報（步驟 19：自動更新且不重複插入） */
const FORECAST_REFRESH_MS = 30 * 60 * 1000;

function App() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [metric, setMetric] = useState<WeatherMetric>('temperature');
  const [locateRequest, setLocateRequest] = useState<{ lat: number; lon: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // 氣溫預報狀態（workflow 步驟 6-16）
  const [forecastRows, setForecastRows] = useState<TemperatureForecastRow[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [regionCoords, setRegionCoords] = useState<RegionCoord[]>(() => loadCachedCoords());
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth > 700);

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

  // 步驟 6-12：CWA 預報 → 解析 MinT/MaxT → 寫入 SQLite → 以 SQL 查詢回網站
  useEffect(() => {
    let active = true;

    /** 從 SQLite 重新查詢預報資料、地區與日期（步驟 12） */
    const applyDatabaseState = async (): Promise<TemperatureForecastRow[]> => {
      const [rows, regionList, dateList] = await Promise.all([
        queryForecasts(),
        queryRegions(),
        queryForecastDates(),
      ]);
      if (!active) return rows;
      setForecastRows(rows);
      setRegions(regionList);
      setDates(dateList);
      return rows;
    };

    const loadForecast = async () => {
      setForecastLoading(true);
      try {
        // 先顯示資料庫中的快取，讓面板立即有內容
        await applyDatabaseState();
      } catch (error) {
        console.error('[Forecast] 讀取 SQLite 失敗：', error);
      }

      try {
        // 步驟 4-7：API → JSON → 解析 MinT / MaxT / 地區 / 日期 → 結構化資料
        const { rows, coords } = await fetchForecast();
        await saveForecasts(rows); // 步驟 8-9：寫入 TemperatureForecasts（主鍵 upsert，不重複插入）
        if (rows.length > 0) {
          const oldest = rows.reduce((min, row) => (row.date < min ? row.date : min), rows[0].date);
          await deleteForecastsBefore(oldest); // 清除已過期的預報日期
        }
        await applyDatabaseState();
        saveCachedCoords(coords);
        setRegionCoords(coords);
        const stats = await queryForecastStats(); // 步驟 10：SQL 驗證資料正確寫入
        console.info('[SQLite] TemperatureForecasts 驗證：', stats);
        if (active) setForecastError(null);
      } catch (error) {
        console.error('[Forecast] 更新失敗：', error);
        if (active) {
          const message = error instanceof Error ? error.message : '未知錯誤';
          setForecastError(`預報更新失敗，目前沿用資料庫中的既有資料（${message}）`);
        }
      } finally {
        if (active) setForecastLoading(false);
      }
    };

    loadForecast();
    const timer = setInterval(loadForecast, FORECAST_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocateRequest({ lat: coords.latitude, lon: coords.longitude });
    });
  };

  // 預設選取臺北市與最新日期（渲染期間校正失效的選取值，資料更新後自動回歸預設）
  if (regions.length > 0 && (!selectedRegion || !regions.includes(selectedRegion))) {
    setSelectedRegion(regions.includes('臺北市') ? '臺北市' : regions[0]);
  }
  if (dates.length > 0 && (!selectedDate || !dates.includes(selectedDate))) {
    setSelectedDate(dates[0]);
  }

  /** 步驟 13-15：查詢所選地區的預報（供折線圖與資料表顯示） */
  const regionRows = useMemo(
    () =>
      forecastRows
        .filter((row) => row.region === selectedRegion)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [forecastRows, selectedRegion]
  );

  /** 步驟 18：所選日期的各地區預報標記（搭配座標顯示於地圖） */
  const forecastMarkers = useMemo<ForecastMarker[]>(() => {
    const coordMap = new Map(regionCoords.map((coord) => [coord.region, coord]));
    return forecastRows
      .filter((row) => row.date === selectedDate)
      .map((row) => {
        const coord = coordMap.get(row.region);
        return coord ? { ...row, lat: coord.lat, lon: coord.lon } : null;
      })
      .filter((marker): marker is ForecastMarker => marker !== null);
  }, [forecastRows, selectedDate, regionCoords]);

  /** 即時概況：依「一週氣溫預報」選取的縣市，改以該縣市的觀測站統計 */
  const overviewStations = useMemo(
    () =>
      stationsForRegion(
        stations,
        selectedRegion || null,
        regionCoords.find((coord) => coord.region === selectedRegion) ?? null
      ),
    [stations, regionCoords, selectedRegion]
  );

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <WeatherMap
        stations={stations}
        onSelectStation={setSelectedStation}
        metric={metric}
        locateRequest={locateRequest}
        forecastMarkers={forecastMarkers}
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
        overviewStations={overviewStations}
        overviewRegion={selectedRegion || null}
        forecastDate={selectedDate || null}
        forecastPanel={
          <ForecastPanel
            regions={regions}
            dates={dates}
            selectedRegion={selectedRegion}
            selectedDate={selectedDate}
            onRegionChange={setSelectedRegion}
            onDateChange={setSelectedDate}
            rows={regionRows}
            loading={forecastLoading}
            error={forecastError}
            expanded={panelOpen}
            onToggle={() => setPanelOpen((open) => !open)}
          />
        }
      />
    </div>
  );
}

export default App;
