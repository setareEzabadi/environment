import { useState, useEffect } from 'react';
import styles from './DashboardKarbar.module.css';
import env from '../../env';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CampaignsUser = () => {
    const [userCampaigns, setUserCampaigns] = useState([]);
    const [loading, setLoading] = useState(false);

    // تابع کمکی برای ارسال درخواست‌ها
    const sendRequest = async (url, method = 'GET', body = null) => {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('توکن احراز هویت یافت نشد');

        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
        return result;
    };

    // دریافت کمپین‌های کاربر
    const fetchUserCampaigns = async () => {
        setLoading(true);
        try {
            const result = await sendRequest(`${env.baseUrl}api/user/campaigns`);
            setUserCampaigns(Array.isArray(result.data) ? result.data : []);
            toast.success('کمپین‌های شما با موفقیت دریافت شدند');
        } catch (err) {
            console.error('خطا در دریافت کمپین‌های کاربر:', err);
            toast.error(err.message || 'خطا در دریافت کمپین‌های کاربر');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserCampaigns();
    }, []);

    return (
        <div className={styles.campaignsUser}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />
            <h3>کمپین‌های شرکت‌شده</h3>
            <p>لیست کمپین‌هایی که در آن‌ها شرکت کرده‌اید.</p>
            {loading ? (
                <div className={styles.loader}>در حال بارگذاری...</div>
            ) : (
                <div className={styles.campaignList}>
                    {userCampaigns.length === 0 ? (
                        <p className={styles.noCampaigns}>شما در هیچ کمپینی شرکت نکرده‌اید.</p>
                    ) : (
                        userCampaigns.map((campaign) => (
                            <div key={campaign.id} className={styles.campaignCard}>
                                <h4>{campaign.title || 'بدون عنوان'}</h4>
                                <p className={styles.description}>{campaign.description || 'بدون توضیحات'}</p>
                                <p>محل: {campaign.location || 'نامشخص'}</p>
                                <p>شروع: {new Date(campaign.start_date).toLocaleDateString('fa-IR')}</p>
                                <p>پایان: {new Date(campaign.end_date).toLocaleDateString('fa-IR')}</p>
                                <p>وضعیت: {campaign.status?.name || 'نامشخص'}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CampaignsUser;