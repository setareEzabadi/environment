import { MapContainer, TileLayer, useMap, useMapEvents, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import L from 'leaflet';

// تنظیم آیکون‌های Leaflet با CDN
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 15); // زوم به سطح 15 برای آدرس خاص
        }
    }, [center, map]);
    return null;
};

const MapPicker = ({ onMapClick, center }) => {
    const [position, setPosition] = useState(null);

    const MapClickHandler = () => {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                onMapClick(e.latlng.lat, e.latlng.lng);
            },
        });
        return position ? <Marker position={position} /> : null;
    };

    return (
        <MapContainer
            center={center || [36.8392, 54.4342]} // مرکز گرگان
            zoom={9} // زوم برای پوشش کل گلستان
            style={{ height: '300px', width: '100%', marginTop: '1rem', borderRadius: '12px', overflow: 'hidden' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapUpdater center={center} />
            <MapClickHandler />
        </MapContainer>
    );
};

export default MapPicker;
