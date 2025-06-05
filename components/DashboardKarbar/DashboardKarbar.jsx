import React, { useState, useEffect } from "react";
import {
    FaFileAlt,
    FaBullhorn,
    FaStar,
    FaUserEdit,
    FaSignOutAlt,
    FaChevronDown,
    FaChevronUp,
    FaTachometerAlt,
    FaUsers, // Added for users management icon
} from "react-icons/fa";
import moment from "jalali-moment";
import styles from "./DashboardKarbar.module.css";
import Campaigns from "./CampaignsUser";
import Stats from "./Stats";
import Profile from "./Profile";
import GetReports from "./GetReports";
import CategoryManagement from "./CategoryManagement";
import AdminDashboard from "./AdminDashboard";
import UserManagement from "./UserManagement"; // Import new component
import env from "../../env";

const sections = [
    {
        key: "adminDashboard",
        label: "داشبورد ادمین",
        icon: FaTachometerAlt,
        adminOnly: true,
    },
    {
        key: "users",
        label: "مدیریت کاربران",
        icon: FaUsers,
        adminOnly: true,
    },
    {
        key: "reports",
        label: "گزارش‌ها",
        icon: FaFileAlt,
        subItems: [
            { key: "Getreports", label: "لیست گزارش‌ها" },
            { key: "categories", label: "مدیریت دسته‌بندی‌ها", adminOnly: true },
        ],
    },
    { key: "campaigns", label: "کمپین‌ها", icon: FaBullhorn },
    { key: "stats", label: "امتیازات", icon: FaStar },
    { key: "profile", label: "ویرایش پروفایل", icon: FaUserEdit },
];

const DashboardKarbar = () => {
    const [active, setActive] = useState("");
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState({ name: "", family: "", avatar: "" });
    const [currentTime, setCurrentTime] = useState(new Date());

    // Check user role and set default active section
    useEffect(() => {
        const checkUserRole = async () => {
            const userData = localStorage.getItem("auth_user");
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    const isAdminUser = parsedUser.role && parsedUser.role.toLowerCase() === "admin";
                    setIsAdmin(isAdminUser);
                    setUser({
                        name: parsedUser.name || "",
                        family: parsedUser.family || "",
                        avatar: parsedUser.avatar ? `${env.baseUrl}${parsedUser.avatar}` : "",
                    });
                    setActive(isAdminUser ? "adminDashboard" : "Getreports");
                } catch (err) {
                    console.error("خطا در پارس داده کاربر:", err);
                    setIsAdmin(false);
                    setActive("Getreports");
                }
            }
        };
        checkUserRole();
    }, []);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        window.location.href = "/";
    };

    const toggleSubMenu = (key) => {
        setOpenSubMenu(openSubMenu === key ? null : key);
    };

    const formattedDate = moment(currentTime).locale("fa").format("jYYYY/jMM/jDD");
    const formattedTime = currentTime.toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.userProfile}>
                    {user.avatar ? (
                        <img src={user.avatar} alt="آواتار کاربر" className={styles.userAvatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <span>{user.name ? user.name[0] : "کاربر"}</span>
                        </div>
                    )}
                    <span className={styles.userName}>
                        {user.name && user.family ? `${user.name} ${user.family}` : "کاربر"}
                    </span>
                </div>
                <ul>
                    {sections
                        .filter((section) => !section.adminOnly || (section.adminOnly && isAdmin))
                        .map((section) => {
                            const Icon = section.icon;
                            const isActive = active === section.key || section.subItems?.some((sub) => sub.key === active);
                            const filteredSubItems = section.subItems?.filter(
                                (subItem) => !subItem.adminOnly || (subItem.adminOnly && isAdmin)
                            );
                            return (
                                <li key={section.key}>
                                    <div
                                        className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
                                        onClick={() => {
                                            if (filteredSubItems && filteredSubItems.length > 0) {
                                                toggleSubMenu(section.key);
                                            } else {
                                                setActive(section.key);
                                            }
                                        }}
                                    >
                                        <Icon className={styles.icon} />
                                        <span>{section.label}</span>
                                        {filteredSubItems && filteredSubItems.length > 0 && (
                                            <span className={styles.chevron}>
                                                {openSubMenu === section.key ? <FaChevronUp /> : <FaChevronDown />}
                                            </span>
                                        )}
                                    </div>
                                    {filteredSubItems && openSubMenu === section.key && (
                                        <ul className={styles.subMenu}>
                                            {filteredSubItems.map((subItem) => (
                                                <li
                                                    key={subItem.key}
                                                    className={`${styles.subMenuItem} ${active === subItem.key ? styles.active : ""}`}
                                                    onClick={() => setActive(subItem.key)}
                                                >
                                                    <span>{subItem.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    <li className={styles.logout} onClick={handleLogout}>
                        <FaSignOutAlt className={styles.icon} />
                        <span>خروج</span>
                    </li>
                </ul>
            </aside>
            <div className={styles.contentWrapper}>
                <main className={styles.content}>
                    {active === "adminDashboard" && isAdmin && <AdminDashboard />}
                    {active === "users" && isAdmin && <UserManagement />}
                    {active === "Getreports" && <GetReports />}
                    {active === "categories" && isAdmin && <CategoryManagement />}
                    {active === "campaigns" && <Campaigns />}
                    {active === "stats" && <Stats />}
                    {active === "profile" && <Profile />}
                </main>
            </div>
        </div>
    );
};

export default DashboardKarbar;