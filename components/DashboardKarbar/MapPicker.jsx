import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
});

const MapPicker = ({ onMapClick }) => {
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
            center={[36.8392, 54.4342]}
            zoom={12}
            style={{ height: '300px', width: '100%', marginTop: '1rem', borderRadius: '12px', overflow: 'hidden' }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler />
        </MapContainer>
    );
};

export default MapPicker;
