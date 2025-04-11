import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./GolestanMap.module.css";

const forestGeoJSON = {
    type: "Feature",
    properties: { name: "جنگل سرسبز", type: "جنگل" },
    geometry: {
        type: "Polygon",
        coordinates: [
            [
                [55.08, 37.27],
                [55.12, 37.27],
                [55.12, 37.23],
                [55.08, 37.23],
                [55.08, 37.27]
            ]
        ]
    }
};

const wetlandGeoJSON = {
    type: "Feature",
    properties: { name: "تالاب آرام", type: "تالاب" },
    geometry: {
        type: "Polygon",
        coordinates: [
            [
                [55.14, 37.33],
                [55.18, 37.33],
                [55.18, 37.29],
                [55.14, 37.29],
                [55.14, 37.33]
            ]
        ]
    }
};

const nationalParkGeoJSON = {
    type: "Feature",
    properties: { name: "پارک ملی", type: "پارک" },
    geometry: {
        type: "Polygon",
        coordinates: [
            [
                [55.05, 37.20],
                [55.09, 37.20],
                [55.09, 37.16],
                [55.05, 37.16],
                [55.05, 37.20]
            ]
        ]
    }
};

const styleFeature = (feature) => {
    switch (feature.properties.type) {
        case "جنگل":
            return { color: "#2ecc71", fillColor: "#2ecc71", fillOpacity: 0.5, weight: 2 };
        case "تالاب":
            return { color: "#3498db", fillColor: "#3498db", fillOpacity: 0.5, weight: 2 };
        case "پارک":
            return { color: "#f1c40f", fillColor: "#f1c40f", fillOpacity: 0.5, weight: 2 };
        default:
            return { color: "#000", fillOpacity: 0.5 };
    }
};

const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
        layer.bindPopup(
            `<strong>${feature.properties.name}</strong><br/>نوع: ${feature.properties.type}`
        );
    }
};

const GolestanMap = () => {
    const center = [37.25, 55.1];

    return (
        <div className={styles.mapSection}>
            <h2>نقشه استان گلستان</h2>
            <div className={styles.mapContainer}>
                <MapContainer center={center} zoom={10} scrollWheelZoom={true} className={styles.map}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                        data={forestGeoJSON}
                        style={styleFeature}
                        onEachFeature={onEachFeature}
                    />
                    <GeoJSON
                        data={wetlandGeoJSON}
                        style={styleFeature}
                        onEachFeature={onEachFeature}
                    />
                    <GeoJSON
                        data={nationalParkGeoJSON}
                        style={styleFeature}
                        onEachFeature={onEachFeature}
                    />
                </MapContainer>
            </div>
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: "#2ecc71" }}></span>
                    جنگل
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: "#3498db" }}></span>
                    تالاب
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: "#f1c40f" }}></span>
                    پارک ملی
                </div>
            </div>
        </div>
    );
};

export default GolestanMap;
