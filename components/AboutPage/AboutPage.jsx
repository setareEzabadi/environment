import React from "react";
import styles from "./AboutPage.module.css";

const AboutPage = () => {
    return (
        <div className={styles.aboutPage}>
            <section className={styles.section}>
                <h1 className={styles.sectionTitle}>درباره ما</h1>
                <p className={styles.sectionText}>
                    ما یک گروه متعهد به حفظ و پاسداری از زیبایی‌های طبیعی کشورمان هستیم.
                    هدف ما آگاهی‌بخشی درباره اهمیت محیط زیست، منابع طبیعی، جنگل‌ها و تالاب‌ها است.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>چشم‌انداز ما</h2>
                <p className={styles.sectionText}>
                    ساختن جهانی سبزتر و پایدارتر برای نسل‌های آینده با آموزش، مشارکت و اجرای پروژه‌های محیط زیستی.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>ارزش‌های ما</h2>
                <ul className={styles.valuesList}>
                    <li>پایداری و احترام به طبیعت</li>
                    <li>شفافیت در فعالیت‌ها</li>
                    <li>مشارکت مردمی</li>
                    <li>نوآوری در حفظ محیط زیست</li>
                </ul>
            </section>
        </div>
    );
};

export default AboutPage;
