import { useState, useEffect } from 'react';
import styles from './Campaigns.module.css';
import env from '../../env';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTrash, FaEdit } from 'react-icons/fa';

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(3); // پیش‌فرض status_id=3
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status_id: '',
        start_date: '',
        end_date: '',
        location: '',
    });
    const [editCampaignId, setEditCampaignId] = useState(null);
    const [paymentData, setPaymentData] = useState({ campaign_id: '', amount: '' });
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('viewCampaigns');

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
                toast.error('خطا در بارگذاری اطلاعات کاربر');
            }
        } else {
            setIsAdmin(false);
        }
    };

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

    // دریافت لیست کمپین‌ها با فیلتر
    const fetchCampaigns = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/CampaignFillter?status_id=${selectedStatus}`);
            setCampaigns(Array.isArray(result.data) ? result.data : []);
            toast.success('کمپین‌ها با موفقیت دریافت شدند');
        } catch (err) {
            console.error('خطا در دریافت کمپین‌ها:', err);
            toast.error(err.message || 'خطا در دریافت کمپین‌ها');
        }
    };

    // دریافت وضعیت‌های کمپین
    const fetchStatuses = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaign-statuses`);
            setStatuses(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            console.error('خطا در دریافت وضعیت‌ها:', err);
            toast.error(err.message || 'خطا در دریافت وضعیت‌ها');
        }
    };

    // دریافت جزئیات کمپین
    const fetchCampaignDetails = async (campaign_id) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCampaign?campaign_id=${campaign_id}`);
            setSelectedCampaign(result.data);
        } catch (err) {
            console.error('خطا در دریافت جزئیات کمپین:', err);
            toast.error(err.message || 'خطا در دریافت جزئیات کمپین');
        }
    };

    // دریافت شرکت‌کنندگان کمپین
    const fetchParticipants = async (campaign_id) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaigns/participants?campaign_id=${campaign_id}`);
            setParticipants(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            console.error('خطا در دریافت شرکت‌کنندگان:', err);
            toast.error(err.message || 'خطا در دریافت شرکت‌کنندگان');
        }
    };

    // دریافت همه کمپین‌ها
    const fetchAllCampaigns = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCampaigns`);
            setCampaigns(Array.isArray(result.data) ? result.data : []);
            toast.success('همه کمپین‌ها با موفقیت دریافت شدند');
        } catch (err) {
            console.error('خطا در دریافت همه کمپین‌ها:', err);
            toast.error(err.message || 'خطا در دریافت همه کمپین‌ها');
        }
    };

    // ایجاد کمپین (فقط ادمین)
    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            await sendRequest(`${env.baseUrl}api/storecampaign`, 'POST', formData);
            fetchAllCampaigns();
            setFormData({ title: '', description: '', status_id: '', start_date: '', end_date: '', location: '' });
            toast.success('کمپین با موفقیت ایجاد شد');
        } catch (err) {
            console.error('خطا در ایجاد کمپین:', err);
            toast.error(err.message || 'خطا در ایجاد کمپین');
        }
    };

    // ویرایش کمپین (فقط ادمین)
    const handleUpdateCampaign = async (e) => {
        e.preventDefault();
        try {
            await sendRequest(`${env.baseUrl}api/updateCampaign`, 'POST', {
                campaign_id: editCampaignId,
                title: formData.title,
            });
            fetchAllCampaigns();
            setEditCampaignId(null);
            setFormData({ title: '', description: '', status_id: '', start_date: '', end_date: '', location: '' });
            toast.success('کمپین با موفقیت ویرایش شد');
        } catch (err) {
            console.error('خطا در ویرایش کمپین:', err);
            toast.error(err.message || 'خطا در ویرایش کمپین');
        }
    };

    // حذف کمپین (فقط ادمین)
    const handleDeleteCampaign = async (campaign_id) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این کمپین را حذف کنید؟')) return;
        try {
            await sendRequest(`${env.baseUrl}api/destroyCampaign`, 'POST', { campaign_id });
            fetchAllCampaigns();
            toast.success('کمپین با موفقیت حذف شد');
        } catch (err) {
            console.error('خطا در حذف کمپین:', err);
            toast.error(err.message || 'خطا در حذف کمپین');
        }
    };

    // پیوستن به کمپین (کاربر عادی)
    const handleJoinCampaign = async (campaign_id) => {
        try {
            await sendRequest(`${env.baseUrl}api/campaigns/join`, 'POST', { campaign_id });
            toast.success('با موفقیت به کمپین پیوستید');
        } catch (err) {
            console.error('خطا در پیوستن به کمپین:', err);
            toast.error(err.message || 'خطا در پیوستن به کمپین');
        }
    };

    // شروع پرداخت (کاربر عادی)
    const handleStartPayment = async (campaign_id) => {
        if (!paymentData.amount || paymentData.amount <= 0) {
            toast.error('لطفاً مبلغ معتبر وارد کنید');
            return;
        }
        try {
            await sendRequest(`${env.baseUrl}api/campaigns/startPayment`, 'POST', {
                campaign_id,
                amount: parseFloat(paymentData.amount),
            });
            toast.success('پرداخت با موفقیت شروع شد');
            setPaymentData({ campaign_id: '', amount: '' });
        } catch (err) {
            console.error('خطا در شروع پرداخت:', err);
            toast.error(err.message || 'خطا در شروع پرداخت');
        }
    };

    // هندل تغییر ورودی‌های فرم
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        checkUserRole();
        fetchStatuses();
        fetchAllCampaigns();

        const handleStorageChange = () => checkUserRole();
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(checkUserRole, 5000);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [selectedStatus]);

    return (
        <div className={styles.campaigns}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />

            {/* تب‌ها */}
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'viewCampaigns' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('viewCampaigns')}
                >
                    مشاهده کمپین‌ها
                </button>
                {isAdmin && (
                    <button
                        className={`${styles.tab} ${activeTab === 'manageCampaigns' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('manageCampaigns')}
                    >
                        مدیریت کمپین‌ها
                    </button>
                )}
            </div>

            {/* محتوای تب‌ها */}
            <div className={styles.tabContent}>
                {activeTab === 'viewCampaigns' && (
                    <>
                        {/* فیلتر کمپین‌ها */}
                        <section className={styles.filterSection}>
                            <h3>فیلتر کمپین‌ها</h3>
                            <div className={styles.filterControls}>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">همه وضعیت‌ها</option>
                                    {statuses.map((status) => (
                                        <option key={status.id} value={status.id}>
                                            {status.name}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={fetchAllCampaigns} className={styles.searchBtn}>
                                    جستجو
                                </button>
                            </div>
                        </section>

                        {/* لیست کمپین‌ها */}
                        <section className={styles.campaignsSection}>
                            <h3>لیست کمپین‌ها</h3>
                            <div className={styles.campaignsList}>
                                {campaigns.length === 0 ? (
                                    <p className={styles.noCampaigns}>کمپینی یافت نشد</p>
                                ) : (
                                    campaigns.map((campaign) => (
                                        <div key={campaign.id} className={styles.campaignCard}>
                                            <h4>{campaign.title || 'بدون عنوان'}</h4>
                                            <p className={styles.description}>{campaign.description || 'بدون توضیحات'}</p>
                                            <p>محل: {campaign.location || 'نامشخص'}</p>
                                            <p>شروع: {new Date(campaign.start_date).toLocaleDateString('fa-IR')}</p>
                                            <p>پایان: {new Date(campaign.end_date).toLocaleDateString('fa-IR')}</p>
                                            <p>وضعیت: {campaign.status?.name || 'نامشخص'}</p>
                                            <div className={styles.actions}>
                                                <button
                                                    onClick={() => fetchCampaignDetails(campaign.id)}
                                                    className={styles.detailsBtn}
                                                >
                                                    جزئیات
                                                </button>
                                                <button
                                                    onClick={() => fetchParticipants(campaign.id)}
                                                    className={styles.participantsBtn}
                                                >
                                                    شرکت‌کنندگان
                                                </button>
                                                {!isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => handleJoinCampaign(campaign.id)}
                                                            className={styles.joinBtn}
                                                        >
                                                            پیوستن
                                                        </button>
                                                        <div className={styles.paymentForm}>
                                                            <input
                                                                type="number"
                                                                name="amount"
                                                                placeholder="مبلغ پرداخت"
                                                                value={paymentData.amount}
                                                                onChange={handlePaymentInputChange}
                                                                className={styles.paymentInput}
                                                            />
                                                            <button
                                                                onClick={() => handleStartPayment(campaign.id)}
                                                                className={styles.paymentBtn}
                                                                disabled={!paymentData.amount}
                                                            >
                                                                پرداخت
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setEditCampaignId(campaign.id);
                                                                setFormData({
                                                                    title: campaign.title,
                                                                    description: campaign.description,
                                                                    status_id: campaign.status_id,
                                                                    start_date: campaign.start_date,
                                                                    end_date: campaign.end_date,
                                                                    location: campaign.location,
                                                                });
                                                                setActiveTab('manageCampaigns');
                                                            }}
                                                            className={styles.editBtn}
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                                            className={styles.deleteBtn}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* جزئیات کمپین */}
                        {selectedCampaign && (
                            <section className={styles.campaignDetails}>
                                <h3>جزئیات کمپین: {selectedCampaign.title}</h3>
                                <p>{selectedCampaign.description || 'بدون توضیحات'}</p>
                                <p>محل: {selectedCampaign.location || 'نامشخص'}</p>
                                <p>وضعیت: {selectedCampaign.status?.name || 'نامشخص'}</p>
                                <p>شروع: {new Date(selectedCampaign.start_date).toLocaleDateString('fa-IR')}</p>
                                <p>پایان: {new Date(selectedCampaign.end_date).toLocaleDateString('fa-IR')}</p>
                            </section>
                        )}

                        {/* شرکت‌کنندگان */}
                        {participants.length > 0 && (
                            <section className={styles.participants}>
                                <h3>شرکت‌کنندگان</h3>
                                <ul className={styles.participantList}>
                                    {participants.map((participant) => (
                                        <li key={participant.id}>{participant.name || 'کاربر ناشناس'}</li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </>
                )}

                {activeTab === 'manageCampaigns' && isAdmin && (
                    <section className={styles.formSection}>
                        <h3>{editCampaignId ? 'ویرایش کمپین' : 'ایجاد کمپین جدید'}</h3>
                        <form
                            onSubmit={editCampaignId ? handleUpdateCampaign : handleCreateCampaign}
                            className={styles.form}
                        >
                            <label>
                                عنوان:
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </label>
                            <label>
                                توضیحات:
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                />
                            </label>
                            <label>
                                وضعیت:
                                <select name="status_id" value={formData.status_id} onChange={handleInputChange}>
                                    <option value="">انتخاب کنید</option>
                                    {statuses.map((status) => (
                                        <option key={status.id} value={status.id}>
                                            {status.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                تاریخ شروع:
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                تاریخ پایان:
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                محل:
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <button type="submit" className={styles.submitBtn}>
                                {editCampaignId ? 'ویرایش کمپین' : 'ایجاد کمپین'}
                            </button>
                        </form>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Campaigns;