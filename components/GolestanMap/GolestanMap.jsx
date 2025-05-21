import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./GolestanMap.module.css";
import env from "../../env";
import L from "leaflet";

// تنظیم آیکون پیش‌فرض برای مارکرها
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// تعریف آیکون‌های سفارشی برای مارکرها
const createCustomIcon = (color) => {
    return new L.Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        `)}`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
        shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
        shadowSize: [36, 36],
    });
};

// آیکون‌ها برای هر حالت
const markerIcons = {
    resolved: createCustomIcon("#10b981"), // سبز
    in_progress: createCustomIcon("#2563eb"), // آبی
    pendingNew: createCustomIcon("#eab308"), // زرد لیمویی (کمتر از ۷ روز)
    pendingMedium: createCustomIcon("#e47e00"), // نارنجی سوخته (۷ تا ۱۴ روز)
    pendingOld: createCustomIcon("#ef4444"), // قرمز (۱۴ روز به بالا)
};

// تابع برای انتخاب آیکون مارکر
const getMarkerIcon = (report) => {
    const status = report.status;
    if (status === "resolved") return markerIcons.resolved;
    if (status === "in_progress") return markerIcons.in_progress;

    // برای pending، محاسبه فاصله زمانی
    const createdDate = new Date(report.created_at);
    const currentDate = new Date();
    const diffTime = currentDate - createdDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 14) {
        return markerIcons.pendingOld; // قرمز
    } else if (diffDays >= 7) {
        return markerIcons.pendingMedium; // نارنجی سوخته
    } else {
        return markerIcons.pendingNew; // زرد لیمویی
    }
};

// کامپوننت برای مدیریت زوم و باز کردن پاپ‌آپ
const MapController = ({ reportId, lat, long }) => {
    const map = useMap();
    useEffect(() => {
        if (reportId && lat && long) {
            map.setView([parseFloat(lat), parseFloat(long)], 15);
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker && layer.options.reportId === reportId) {
                    layer.openPopup();
                }
            });
        }
    }, [reportId, lat, long, map]);
    return null;
};

const GolestanMap = () => {
    const center = [36.8386, 54.4347]; // مختصات گرگان
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("map");
    const [selectedReport, setSelectedReport] = useState(null); // گزارش انتخاب‌شده برای نمایش روی نقشه
    const mapRef = useRef(null);

    // تبدیل وضعیت به فارسی
    const getStatusText = (status) => {
        switch (status) {
            case "resolved":
                return "حل‌شده";
            case "pending":
                return "در انتظار";
            case "in_progress":
                return "در حال انجام";
            default:
                return "در انتظار";
        }
    };

    // درخواست API
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            const token = localStorage.getItem("auth_token");
            if (!token) {
                setError("توکن احراز هویت یافت نشد");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${env.baseUrl}api/getReports`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const result = await response.json();
                if (result.status && result.data) {
                    setReports(result.data);
                } else {
                    setError("خطا در دریافت داده‌ها");
                }
            } catch (err) {
                setError("خطا در ارتباط با سرور");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    // تابع برای نمایش گزارش روی نقشه
    const showOnMap = (report) => {
        setActiveTab("map");
        setSelectedReport(report);
    };

    return (
        <div className={styles.mapSection}>
            <h2>نقشه گرگان</h2>
            {error && <div className={styles.error}>{error}</div>}
            {loading && (
                <div className={styles.loading}>
                    <span className={styles.loader}></span> در حال بارگذاری...
                </div>
            )}
            <div className={styles.tabContainer}>
                <div className={styles.tabList}>
                    <button
                        className={`${styles.tab} ${activeTab === "map" ? styles.activeTab : ""}`}
                        onClick={() => {
                            setActiveTab("map");
                            setSelectedReport(null); // پاک کردن انتخاب گزارش هنگام تغییر به تب نقشه
                        }}
                    >
                        نقشه
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "table" ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab("table")}
                    >
                        جدول
                    </button>
                </div>
                <div className={styles.tabContent}>
                    {activeTab === "map" && (
                        <div className={styles.mapContainer}>
                            <MapContainer
                                center={center}
                                zoom={12}
                                scrollWheelZoom={true}
                                className={styles.map}
                                ref={mapRef}
                            >
                                <TileLayer
                                    attribution='© OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {selectedReport && (
                                    <MapController
                                        reportId={selectedReport.id}
                                        lat={selectedReport.lat}
                                        long={selectedReport.long}
                                    />
                                )}
                                {reports.map((report) => (
                                    <Marker
                                        key={report.id}
                                        position={[parseFloat(report.lat), parseFloat(report.long)]}
                                        icon={getMarkerIcon(report)} // استفاده از آیکون سفارشی
                                        reportId={report.id} // برای شناسایی مارکر
                                    >
                                        <Popup className={styles.customPopup} autoPan={true}>
                                            <div className={styles.reportCard}>
                                                <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                                                    {getStatusText(report.status)}
                                                </span>
                                                <h4>{report.title || "بدون عنوان"}</h4>
                                                <div className={styles.detail}>
                                                    <span className={styles.label}>توضیحات:</span>
                                                    <span>{report.description || "بدون توضیحات"}</span>
                                                </div>
                                                <div className={styles.detail}>
                                                    <span className={styles.label}>موقعیت:</span>
                                                    <span>{report.location || "نامشخص"}</span>
                                                </div>
                                                {report.images && report.images.length > 0 && (
                                                    <div className={styles.images}>
                                                        <span className={styles.label}>تصاویر:</span>
                                                        <div className={styles.imageGallery}>
                                                            {report.images.map((image) => (
                                                                <a
                                                                    key={image.id}
                                                                    href={`${env.baseUrl}${image.image_url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <img
                                                                        src={`${env.baseUrl}${image.image_url}`}
                                                                        alt="گزارش"
                                                                        className={styles.reportImage}
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    )}
                    {activeTab === "table" && (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>عنوان</th>
                                        <th>وضعیت</th>
                                        <th>توضیحات</th>
                                        <th>موقعیت</th>
                                        <th>نمایش</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report.id}>
                                            <td>{report.title || "بدون عنوان"}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                                                    {getStatusText(report.status)}
                                                </span>
                                            </td>
                                            <td>{report.description || "بدون توضیحات"}</td>
                                            <td>{report.location || "نامشخص"}</td>
                                            <td>
                                                <button
                                                    className={styles.showOnMapButton}
                                                    onClick={() => showOnMap(report)}
                                                >
                                                    نمایش روی نقشه
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GolestanMap;
