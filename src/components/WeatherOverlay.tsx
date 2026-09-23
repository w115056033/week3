import type { StationData } from '../api';
import type { WeatherMetric } from './WeatherMap';
import { AlertTriangle, CloudRain, Compass, Droplets, LocateFixed, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react';

interface WeatherOverlayProps {
    station: StationData | null;
    stations: StationData[];
    totalStations: number;
    metric: WeatherMetric;
    onMetricChange: (metric: WeatherMetric) => void;
    onLocate: () => void;
    lastUpdated: Date | null;
    loading: boolean;
}

const layers: { id: WeatherMetric; label: string; icon: typeof Thermometer }[] = [
    { id: 'temperature', label: '氣溫', icon: Thermometer },
    { id: 'rainfall', label: '雨量', icon: CloudRain },
    { id: 'wind', label: '風速', icon: Wind },
    { id: 'humidity', label: '濕度', icon: Droplets },
    { id: 'stations', label: '測站', icon: MapPin },
];

const validValues = (stations: StationData[], pick: (station: StationData) => number | null) =>
    stations.map(pick).filter((value): value is number => value !== null && Number.isFinite(value));

export default function WeatherOverlay({ station, stations, totalStations, metric, onMetricChange, onLocate, lastUpdated, loading }: WeatherOverlayProps) {
    const temperatures = validValues(stations, item => item.temp);
    const winds = validValues(stations, item => item.windSpeed);
    const rainfall = validValues(stations, item => item.rainfall);
    const highest = stations.find(item => item.temp === Math.max(...temperatures));
    const lowest = stations.find(item => item.temp === Math.min(...temperatures));
    const wettest = stations.find(item => item.rainfall === Math.max(...rainfall));
    const strongest = stations.find(item => item.windSpeed === Math.max(...winds));
    const alertCount = stations.filter(item => /雨|雷|颱|強風|大風/.test(item.weather || '')).length;

    return (
        <div className="weather-ui">
            <header className="topbar glass-panel">
                <div className="brand-lockup">
                    <div className="brand-mark"><Compass size={19} /></div>
                    <div><strong>台灣即時氣象</strong><span>全台觀測站 · CWA open data</span></div>
                </div>
                <div className="topbar-actions">
                    <span className="live-status"><i /> LIVE · {totalStations} 站</span>
                    <button className="icon-button" onClick={onLocate} title="定位我的位置" aria-label="定位我的位置"><LocateFixed size={18} /></button>
                </div>
            </header>

            <aside className="left-rail">
                <div className="layer-panel glass-panel">
                    <div className="panel-kicker">圖層</div>
                    <div className="layer-list">
                        {layers.map(({ id, label, icon: Icon }) => (
                            <button key={id} className={`layer-button ${metric === id ? 'active' : ''}`} onClick={() => onMetricChange(id)}><Icon size={17} /><span>{label}</span></button>
                        ))}
                    </div>
                    <div className="panel-divider" />
                    <div className="panel-kicker">底圖</div>
                    <div className="base-map-label"><span className="base-map-swatch" /> 深色街道圖</div>
                </div>
            </aside>

            <main className="right-column">
                <section className="stats-panel glass-panel">
                    <div className="section-heading"><span>即時概況</span><span className="update-time"><RefreshCw size={12} /> {loading ? '讀取中' : lastUpdated ? `更新於 ${lastUpdated.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}` : '等待資料'}</span></div>
                    <div className="stat-grid">
                        <div><span>最高溫</span><strong>{highest?.temp ?? '--'}<small>°C</small></strong><em>{highest?.name || '無資料'}</em></div>
                        <div><span>最低溫</span><strong>{lowest?.temp ?? '--'}<small>°C</small></strong><em>{lowest?.name || '無資料'}</em></div>
                        <div><span>最大雨量</span><strong>{wettest?.rainfall ?? '--'}<small> mm</small></strong><em>{wettest?.name || '無資料'}</em></div>
                        <div><span>最大風速</span><strong>{strongest?.windSpeed ?? '--'}<small> m/s</small></strong><em>{strongest?.name || '無資料'}</em></div>
                    </div>
                </section>

                {station ? (
                    <section className="station-detail glass-panel">
                        <div className="section-heading"><span>測站詳情</span><span className="close-detail">{station.name}</span></div>
                        <div className="detail-title"><MapPin size={17} /><strong>{station.name}</strong><span>{station.weather || '觀測資料'}</span></div>
                        <div className="detail-grid">
                            <div><Thermometer size={16} /><span>氣溫</span><strong>{station.temp ?? '--'}°</strong></div>
                            <div><Droplets size={16} /><span>濕度</span><strong>{station.humidity ?? '--'}%</strong></div>
                            <div><Wind size={16} /><span>風速</span><strong>{station.windSpeed ?? '--'} m/s</strong></div>
                            <div><CloudRain size={16} /><span>雨量</span><strong>{station.rainfall ?? '--'} mm</strong></div>
                        </div>
                        <span className="station-time">觀測時間 {station.time ? new Date(station.time).toLocaleString('zh-TW') : '--'}</span>
                    </section>
                ) : <section className="hint-panel glass-panel"><MapPin size={18} /><span>點選地圖上的測站，查看即時觀測資料</span></section>}

                <section className="alert-panel glass-panel">
                    <div className="section-heading"><span><AlertTriangle size={15} /> 天氣提醒</span><b>{alertCount}</b></div>
                    <p>{alertCount ? `目前有 ${alertCount} 個測站回報雨勢或風勢變化，請點選地圖確認。` : '目前測站沒有回報明顯雨勢或強風。'}</p>
                </section>
            </main>

            <div className="map-legend glass-panel">
                <span className="legend-title">{layers.find(layer => layer.id === metric)?.label}</span>
                <div className="legend-gradient" />
                <div className="legend-labels"><span>{metric === 'rainfall' ? '0 mm' : metric === 'wind' ? '0 m/s' : metric === 'humidity' ? '0%' : '15°'}</span><span>{metric === 'rainfall' ? '10+ mm' : metric === 'wind' ? '10+ m/s' : metric === 'humidity' ? '100%' : '35°'}</span></div>
            </div>
        </div>
    );
}
