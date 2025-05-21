import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
    FaTree,
    FaHome,
    FaInfoCircle,
    FaRegNewspaper,
    FaEnvelope,
    FaChartBar,
    FaBullhorn,
} from "react-icons/fa";
import styles from "./Header.module.css";

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef();
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem("auth_user");
        const fromLogin = localStorage.getItem("fromLogin");

        console.log("Stored User:", storedUser);
        console.log("From Login:", fromLogin);
        console.log("Type of From Login:", typeof fromLogin);

        if (storedUser && fromLogin === "true") {
            console.log("Condition matched, attempting to reload...");
            try {
                setUser(JSON.parse(storedUser));
                localStorage.removeItem("fromLogin");
                setTimeout(() => {
                    console.log("Reloading with router...");
                    router.reload();
                }, 100);
            } catch (error) {
                console.error("Error during reload process:", error);
            }
        } else {
            console.log("Condition not matched:", { storedUser, fromLogin });
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
    }, [router]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        window.addEventListener("click", handler);
        return () => window.removeEventListener("click", handler);
    }, []);

    const toggleMenu = () => setMenuOpen((p) => !p);

    const logout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/";
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <FaTree className={styles.logoIcon} />
                    <span>EcoSite</span>
                </div>

                <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
                    <a href="/" onClick={() => setMenuOpen(false)}>
                        <span>خانه</span>
                        <FaHome className={styles.navIcon} />
                    </a>
                    <a href="/about_page" onClick={() => setMenuOpen(false)}>
                        <span>درباره ما</span>
                        <FaInfoCircle className={styles.navIcon} />
                    </a>
                    <a href="/blog" onClick={() => setMenuOpen(false)}>
                        <span>بلاگ</span>
                        <FaRegNewspaper className={styles.navIcon} />
                    </a>
                    <a href="/reports" onClick={() => setMenuOpen(false)}>
                        <span>گزارش</span>
                        <FaChartBar className={styles.navIcon} />
                    </a>
                    <a href="/campaigns" onClick={() => setMenuOpen(false)}>
                        <span>کمپین</span>
                        <FaBullhorn className={styles.navIcon} />
                    </a>
                    <a href="/contact_page" onClick={() => setMenuOpen(false)}>
                        <span>تماس با ما</span>
                        <FaEnvelope className={styles.navIcon} />
                    </a>
                </nav>

                <div className={styles.auth}>
                    {user ? (
                        <div className={styles.userMenu} ref={dropdownRef}>
                            <button
                                className={styles.userBtn}
                                onClick={() => setDropdownOpen((p) => !p)}
                            >
                                {user.name}
                            </button>
                            {dropdownOpen && (
                                <ul className={styles.dropdown}>
                                    <li>
                                        <a href="/dashboard">پنل کاربری</a>
                                    </li>
                                    <li>
                                        <button onClick={logout}>خروج</button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    ) : (
                        <a href="/login" className={styles.authBtn}>
                            ورود | ثبت نام
                        </a>
                    )}
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
