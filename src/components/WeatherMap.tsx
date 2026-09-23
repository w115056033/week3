import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { StationData } from '../api';

const customIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: var(--accent-color); width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px var(--accent-color);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

interface WeatherMapProps {
    onSelectStation: (station: StationData) => void;
    stations: StationData[];
}

export default function WeatherMap({ onSelectStation, stations }: WeatherMapProps) {
    return (
        <MapContainer center={[23.6978, 120.9605]} zoom={7} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3v25_1_b913d8aa274ab7299b70b050"
            />
            {stations.map(station => (
                <Marker
                    key={station.id}
                    position={[station.lat, station.lon]}
                    icon={customIcon}
                    eventHandlers={{
                        click: () => onSelectStation(station)
                    }}
                >
                    <Popup>
                        <div style={{ padding: '4px', textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{station.name}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--accent-color)' }}>{station.temp !== null ? `${station.temp}°C` : 'N/A'}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
