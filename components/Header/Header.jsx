import { useState } from "react";
import { FaTree, FaHome, FaInfoCircle, FaRegNewspaper, FaEnvelope } from "react-icons/fa";
import styles from "./Header.module.css";

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(prev => !prev);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <FaTree className={styles.logoIcon} />
                    <span>EcoSite</span>
                </div>
                <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
                    <a href="/" onClick={closeMenu}>
                        <span>خانه</span>
                        <FaHome className={styles.navIcon} />
                    </a>
                    <a href="/about_page" onClick={closeMenu}>
                        <span>درباره ما</span>
                        <FaInfoCircle className={styles.navIcon} />
                    </a>
                    <a href="/blog" onClick={closeMenu}>
                        <span>بلاگ</span>
                        <FaRegNewspaper className={styles.navIcon} />
                    </a>
                    <a href="/contact_page" onClick={closeMenu}>
                        <span>تماس با ما</span>
                        <FaEnvelope className={styles.navIcon} />
                    </a>
                </nav>
                <div className={styles.auth}>
                    <a href="/login" className={styles.authBtn}>ورود | ثبت نام</a>
                </div>
                <div className={styles.hamburger} onClick={toggleMenu}>
                    <span className={menuOpen ? styles.active : ""}></span>
                    <span className={menuOpen ? styles.active : ""}></span>
                    <span className={menuOpen ? styles.active : ""}></span>
                </div>
            </div>
        </header>
    );
};

export default Header;
