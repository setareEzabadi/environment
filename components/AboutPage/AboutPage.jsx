import React from "react";
import styles from "./AboutPage.module.css";

const AboutPage = () => {
    return (
        <div className={styles.aboutPage}>
            <section className={styles.section}>
                <h1 className={styles.sectionTitle}>درباره ما</h1>
                <p className={styles.sectionText}>
                    ما یک تیم جوان و دغدغه‌مند هستیم که با هدف حفاظت از محیط زیست و منابع طبیعی ایران این پلتفرم را طراحی کرده‌ایم. در این وبسایت، شهروندان می‌توانند مشکلات محیط‌زیستی اطراف خود را گزارش دهند، آن‌ها را روی نقشه ببینند، و با مشارکت در پویش‌ها و امدادرسانی‌ها، در حل آن‌ها نقش داشته باشند.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>چشم‌انداز ما</h2>
                <p className={styles.sectionText}>
                    ساخت بستری هوشمند و مردمی برای مدیریت و پیگیری مشکلات محیط زیستی در سراسر کشور، با کمک کاربران، سازمان‌های مسئول، و فعالان حوزه محیط زیست.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>ارزش‌های ما</h2>
                <ul className={styles.valuesList}>
                    <li>همکاری مردمی برای حفاظت از طبیعت</li>
                    <li>شفافیت و مسئولیت‌پذیری در انتشار اطلاعات</li>
                    <li>نوآوری و فناوری برای رصد و پاسخ سریع‌تر</li>
                    <li>آگاهی‌بخشی عمومی برای تغییر پایدار</li>
                </ul>
            </section>
        </div>
    );
};

export default AboutPage;
