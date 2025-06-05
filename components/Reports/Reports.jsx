import { useState, useEffect } from 'react';
import styles from './Reports.module.css';
import env from '../../env';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NewReportForm from './NewReportForm';
import ManageReports from './ManageReports';

const Reports = () => {
    const [categories, setCategories] = useState([]);
    const [regions, setRegions] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('newReport');

    // بررسی نقش کاربر
    const checkUserRole = () => {
        const userData = localStorage.getItem('auth_user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                const isAdminUser = parsedUser.role && parsedUser.role.toLowerCase() === 'admin';
                setIsAdmin(isAdminUser);
            } catch (err) {
                console.error('خطا در پارس داده کاربر:', err);
                setIsAdmin(false);
                toast.error('خطا در بارگذاری اطلاعات کاربر');
            }
        } else {
            setIsAdmin(false);
        }
    };

    useEffect(() => {
        checkUserRole();
        fetchCategories();
        fetchRegions();

        const handleStorageChange = () => checkUserRole();
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(checkUserRole, 5000);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // دریافت دسته‌بندی‌ها (بدون نیاز به توکن)
    const fetchCategories = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`${env.baseUrl}api/getCategories`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setCategories(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error('خطا در دریافت دسته‌بندی‌ها:', error);
            toast.error('خطا در بارگذاری دسته‌بندی‌ها');
        }
    };

    // دریافت مناطق (بدون نیاز به توکن)
    const fetchRegions = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`${env.baseUrl}api/getRegions`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setRegions(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error('خطا در دریافت مناطق:', error);
            toast.error('خطا در بارگذاری مناطق');
        }
    };

    return (
        <div className={styles.reports}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />

            {/* تب‌ها */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'newReport' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('newReport')}
                >
                    ثبت گزارش جدید
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'manageReports' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('manageReports')}
                >
                    {isAdmin ? 'مدیریت گزارش‌ها' : 'نمایش گزارش‌ها'}
                </button>
            </div>

            {/* محتوای تب‌ها */}
            <div className={styles.tabContent}>
                {activeTab === 'newReport' && (
                    <NewReportForm
                        categories={categories}
                        regions={regions}
                        fetchReports={() => { }}
                    />
                )}
                {activeTab === 'manageReports' && (
                    <ManageReports
                        categories={categories}
                        regions={regions}
                        isAdmin={isAdmin}
                        fetchCategories={fetchCategories}
                    />
                )}
            </div>
        </div>
    );
};

export default Reports;