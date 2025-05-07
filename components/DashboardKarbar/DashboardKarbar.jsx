import React, { useState } from 'react';
import {
    FaFileAlt,
    FaBullhorn,
    FaStar,
    FaUserEdit,
    FaSignOutAlt,
} from 'react-icons/fa';
import styles from './DashboardKarbar.module.css';
import Campaigns from './CampaignsUser';
import Stats from './Stats';
import Profile from './Profile';
import GetReports from './GetReports';

// بخش‌های داشبورد
const sections = [
    { key: 'Getreports', label: 'گزارش‌ها', icon: FaFileAlt },
    { key: 'campaigns', label: 'کمپین‌ها', icon: FaBullhorn },
    { key: 'stats', label: 'امتیازات', icon: FaStar },
    { key: 'profile', label: 'ویرایش پروفایل', icon: FaUserEdit }
];

const DashboardKarbar = () => {
    const [active, setActive] = useState('Getreports');

    const handleLogout = () => {
        window.location.href = '/';
    };

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <ul>
                    {sections.map(section => {
                        const Icon = section.icon;
                        const isActive = active === section.key;
                        return (
                            <li
                                key={section.key}
                                className={isActive ? styles.active : ''}
                                onClick={() => setActive(section.key)}
                            >
                                <Icon className={styles.icon} />
                                <span>{section.label}</span>
                            </li>
                        );
                    })}
                    <li className={styles.logout} onClick={handleLogout}>
                        <FaSignOutAlt className={styles.icon} />
                        <span>خروج</span>
                    </li>
                </ul>
            </aside>
            <main className={styles.content}>
                {active === 'Getreports' && <GetReports />}
                {active === 'campaigns' && <Campaigns />}
                {active === 'stats' && <Stats />}
                {active === 'profile' && <Profile />}
            </main>
        </div>
    );
};

export default DashboardKarbar;
