import React from "react";
import styles from "./ContactPage.module.css";

const ContactPage = () => {
    return (
        <div className={styles.contactPage}>
            <h1>تماس با ما</h1>
            <p>برای ارتباط با ما، لطفاً فرم زیر را پر کنید یا از اطلاعات تماس استفاده کنید.</p>

            <form className={styles.contactForm}>
                <input type="text" placeholder="نام شما" required />
                <input type="email" placeholder="ایمیل شما" required />
                <textarea placeholder="پیام شما..." rows="5" required></textarea>
                <button type="submit">ارسال پیام</button>
            </form>

            <div className={styles.contactInfo}>
                <p><strong>ایمیل:</strong> info@natureproject.ir</p>
                <p><strong>تلفن:</strong> ۰۹۱۲۱۲۳۴۵۶۷</p>
            </div>
        </div>
    );
};

export default ContactPage;
