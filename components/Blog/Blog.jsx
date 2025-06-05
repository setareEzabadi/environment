import React, { useState, useEffect } from "react";
import styles from "./Blog.module.css";
import env from "../../env";

const Blog = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${env.baseUrl}api/getRegions`);
                if (!response.ok) throw new Error("خطا در دریافت داده‌ها");
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className={styles.loading}>در حال بارگذاری...</div>;
    if (error) return <div className={styles.error}>خطا: {error}</div>;
    if (!data || !data.status || !data.data) return <div className={styles.error}>داده‌ای یافت نشد!</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>مناطق طبیعی گلستان</h1>
            <div className={styles.cardContainer}>
                {data.data.map((region) => (
                    <div key={region.id} className={styles.card}>
                        <img
                            src={region.image_url ? `${env.baseUrl}${region.image_url}` : "/images/placeholder.jpg"}
                            alt={region.name}
                            className={styles.cardImage}
                        />
                        <div className={styles.cardContent}>
                            <h2 className={styles.cardTitle}>{region.name}</h2>
                            <p className={styles.cardMeta}>نوع: {region.type}</p>
                            <p className={styles.cardMeta}>استان: {region.province}</p>
                            <p className={styles.cardDescription}>{region.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Blog;