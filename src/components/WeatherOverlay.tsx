import type { StationData } from '../api';
import { Thermometer, Droplets, MapPin, Clock } from 'lucide-react';

interface WeatherOverlayProps {
    station: StationData | null;
    totalStations: number;
}

export default function WeatherOverlay({ station, totalStations }: WeatherOverlayProps) {
    return (
        <div className="glass-panel" style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '320px',
            padding: '24px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'all 0.3s ease'
        }}>
            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={24} color="var(--accent-color)" />
                    Taiwan Weather
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {totalStations} Stations Live
                </p>
            </div>

            {station ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.5s ease-out' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--accent-color)' }}>{station.name}</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {new Date(station.time).toLocaleString('zh-TW')}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                            <Thermometer size={24} color="var(--accent-color)" />
                            <div style={{ marginTop: '8px', fontSize: '24px', fontWeight: 'bold' }}>
                                {station.temp !== null ? `${station.temp}°` : '--'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Temp</div>
                        </div>

                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                            <Droplets size={24} color="var(--accent-color)" />
                            <div style={{ marginTop: '8px', fontSize: '24px', fontWeight: 'bold' }}>
                                {station.humidity !== null ? `${station.humidity}%` : '--'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Humidity</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Select a station on the map to view live conditions.
                </div>
            )}

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
