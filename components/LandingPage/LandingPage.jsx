import React from "react";
import dynamic from "next/dynamic";
import { FaLeaf, FaSeedling, FaRecycle } from "react-icons/fa";
import GallerySlider from "../GallerySlider/GallerySlider";
import styles from "./LandingPage.module.css";

const GolestanMap = dynamic(
    () => import("../GolestanMap/GolestanMap"),
    { ssr: false }
);

const LandingPage = () => {
    return (
        <div className={styles.landingPage}>
            <main className={styles.main}>
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <h1>زیبایی طبیعت، الهام‌بخش زندگی</h1>
                        <p>با ما همراه شوید تا زیبایی‌های بی‌نظیر طبیعت را کشف کنید و از آن لذت ببرید.</p>
                        <a href="/about_page" className={styles.ctaButton}>بیشتر بدانید</a>
                    </div>
                </section>

                <section className={styles.features}>
                    <div className={styles.feature}>
                        <FaLeaf size={40} color="#17c05f" />
                        <h2>پروژه‌های سبز</h2>
                        <p>ایده‌های نوین برای حفظ محیط زیست و توسعه پایدار.</p>
                    </div>
                    <div className={styles.feature}>
                        <FaSeedling size={40} color="#17c05f" />
                        <h2>طبیعت در کنار شما</h2>
                        <p>تجربه‌های واقعی از زندگی در کنار طبیعت و بهره‌مندی از منابع طبیعی.</p>
                    </div>
                    <div className={styles.feature}>
                        <FaRecycle size={40} color="#17c05f" />
                        <h2>مدیریت پسماند</h2>
                        <p>راهکارهایی برای کاهش ضایعات و استفاده بهینه از منابع.</p>
                    </div>
                </section>

                <GolestanMap />

                <section className={styles.gallery}>
                    <h2>گالری الهام‌بخش طبیعت</h2>
                    <GallerySlider />
                </section>

                <section className={styles.cta}>
                    <h2>همین حالا به ما بپیوندید</h2>
                    <a href="/contact_page" className={styles.ctaButton}>تماس با ما</a>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;
