import styles from "./Footer.module.css";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div className={styles.section}>
                    <h4>درباره ما</h4>
                    <p>ما با اشتیاق به محیط زیست باور داریم و برای ساخت آینده‌ای پایدار تلاش می‌کنیم.</p>
                </div>
                <div className={styles.section}>
                    <h4>ارتباط با ما</h4>
                    <p>ایمیل: info@ecosite.com</p>
                    <p>تلفن: ۰۹۱۲۳۴۵۶۷۸</p>
                </div>
                <div className={styles.section}>
                    <h4>شبکه‌های اجتماعی</h4>
                    <div className={styles.socialIcons}>
                        <a href="#" className={styles.socialLink}>
                            <FaFacebookF />
                        </a>
                        <a href="#" className={styles.socialLink}>
                            <FaInstagram />
                        </a>
                        <a href="#" className={styles.socialLink}>
                            <FaTwitter />
                        </a>
                    </div>
                </div>
            </div>
            <div className={styles.copy}>
                <p>تمامی حقوق محفوظ است &copy; 2025 EcoSite</p>
            </div>
        </footer>
    );
};

export default Footer;
