import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import type { StationData } from '../api';

export type WeatherMetric = 'temperature' | 'rainfall' | 'wind' | 'humidity' | 'stations';

interface WeatherMapProps {
    onSelectStation: (station: StationData) => void;
    stations: StationData[];
    metric: WeatherMetric;
    locateRequest: { lat: number; lon: number } | null;
}

const metricValue = (station: StationData, metric: WeatherMetric) => {
    if (metric === 'rainfall') return station.rainfall;
    if (metric === 'wind') return station.windSpeed;
    if (metric === 'humidity') return station.humidity;
    return station.temp;
};

const markerColor = (station: StationData, metric: WeatherMetric) => {
    const value = metricValue(station, metric) ?? 0;
    if (metric === 'rainfall') return value > 10 ? '#2563eb' : value > 1 ? '#38bdf8' : '#94a3b8';
    if (metric === 'wind') return value > 10 ? '#f97316' : value > 5 ? '#facc15' : '#5eead4';
    if (metric === 'humidity') return value > 80 ? '#22d3ee' : value > 60 ? '#60a5fa' : '#fbbf24';
    if (metric === 'temperature') return value > 32 ? '#ef4444' : value > 28 ? '#fb923c' : value < 15 ? '#60a5fa' : '#facc15';
    return '#f7b955';
};

function MapViewport({ locateRequest }: Pick<WeatherMapProps, 'locateRequest'>) {
    const map = useMap();

    useEffect(() => {
        if (locateRequest) map.flyTo([locateRequest.lat, locateRequest.lon], 10, { duration: 0.8 });
    }, [locateRequest, map]);

    return null;
}

export default function WeatherMap({ onSelectStation, stations, metric, locateRequest }: WeatherMapProps) {
    return (
        <MapContainer center={[23.6978, 120.9605]} zoom={7} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <MapViewport locateRequest={locateRequest} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3v25_1_b913d8aa274ab7299b70b050"
            />
            {stations.map(station => {
                const color = markerColor(station, metric);
                const size = metric === 'stations' ? 10 : Math.max(10, Math.min(20, 10 + (metricValue(station, metric) ?? 0) / 4));
                const icon = new L.DivIcon({
                    className: 'weather-marker',
                    html: `<span style="--marker-color:${color}; width:${size}px; height:${size}px"></span>`,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2]
                });

                return (
                    <Marker
                        key={station.id}
                        position={[station.lat, station.lon]}
                        icon={icon}
                        eventHandlers={{ click: () => onSelectStation(station) }}
                    >
                        <Popup>
                            <div className="station-popup">
                                <strong>{station.name}</strong>
                                <span>{station.weather || '觀測站'} · {station.temp !== null ? `${station.temp}°C` : '無溫度資料'}</span>
                                <span>濕度 {station.humidity ?? '--'}% · 風速 {station.windSpeed ?? '--'} m/s</span>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
