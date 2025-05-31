import { useState, useEffect } from 'react';
import styles from './Campaigns.module.css';
import env from '../../env';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CampaignList from './CampaignList';
import CampaignForm from './CampaignForm';

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status_id: '',
        start_date: null,
        end_date: null,
        location: '',
    });
    const [editCampaignId, setEditCampaignId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('viewCampaigns');

    const checkUserRole = () => {
        const userData = localStorage.getItem('auth_user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                const isAdminUser = parsedUser.role && parsedUser.role.toLowerCase() === 'admin';
                setIsAdmin(isAdminUser);
            } catch (err) {
                console.error('خطا در پارس داده کاربر:', err);
                toast.error('خطا در بارگذاری اطلاعات کاربر', { toastId: 'checkUserRole' });
            }
        } else {
            setIsAdmin(false);
        }
    };

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

        if (!response.ok) {
            if (result.message === 'شما قبلاً به این کمپین پیوسته‌اید.') {
                return { success: false, message: result.message };
            }
            throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
        }
        return result;
    };

    const fetchCampaigns = async () => {
        try {
            const statusFilter = selectedStatus ? `?status_id=${selectedStatus}` : '';
            const result = await sendRequest(`${env.baseUrl}api/CampaignFillter${statusFilter}`);
            setCampaigns(Array.isArray(result.data) ? result.data : []);
            toast.success('کمپین‌ها با موفقیت دریافت شدند', { toastId: 'fetchCampaigns' });
        } catch (err) {
            console.error('خطا در دریافت کمپین‌ها:', err);
            toast.error(err.message || 'خطا در دریافت کمپین‌ها', { toastId: 'fetchCampaignsError' });
        }
    };

    const fetchStatuses = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaign-statuses`);
            const statusesData = Array.isArray(result.data) ? result.data : [];
            setStatuses(statusesData);
        } catch (err) {
            console.error('خطا در دریافت وضعیت‌ها:', err);
            toast.error(err.message || 'خطا در دریافت وضعیت‌ها', { toastId: 'fetchStatuses' });
        }
    };

    const fetchCampaignDetails = async (campaign_id) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCampaign?campaign_id=${campaign_id}`);
            setSelectedCampaign(result.campaign);
            setParticipants(result.campaign.participants || []);
            return result;
        } catch (err) {
            console.error('خطا در دریافت جزئیات کمپین:', err);
            toast.error(err.message || 'خطا در دریافت جزئیات کمپین', { toastId: 'fetchCampaignDetails' });
            throw err;
        }
    };

    const fetchParticipants = async (campaign_id) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaigns/participants?campaign_id=${campaign_id}`);
            setParticipants(result.participants || []);
            return result;
        } catch (err) {
            console.error('خطا در دریافت شرکت‌کنندگان:', err);
            toast.error(err.message || 'خطا در دریافت شرکت‌کنندگان', { toastId: 'fetchParticipants' });
            throw err;
        }
    };

    const fetchAllCampaigns = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCampaigns`);
            setCampaigns(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            console.error('خطا در دریافت همه کمپین‌ها:', err);
            toast.error(err.message || 'خطا در دریافت همه کمپین‌ها', { toastId: 'fetchAllCampaigns' });
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            await sendRequest(`${env.baseUrl}api/storecampaign`, 'POST', formData);
            await fetchAllCampaigns();
            setFormData({ title: '', description: '', status_id: '', start_date: '', end_date: '', location: '' });
            toast.success('کمپین با موفقیت ایجاد شد', { toastId: 'createCampaign' });
        } catch (err) {
            console.error('خطا در ایجاد کمپین:', err);
            toast.error(err.message || 'خطا در ایجاد کمپین', { toastId: 'createCampaignError' });
        }
    };

    const handleUpdateCampaign = async (e) => {
        e.preventDefault();
        try {
            await sendRequest(`${env.baseUrl}api/updateCampaign`, 'POST', {
                campaign_id: editCampaignId,
                title: formData.title,
                description: formData.description,
                status_id: formData.status_id,
                start_date: formData.start_date,
                end_date: formData.end_date,
                location: formData.location,
            });
            await fetchAllCampaigns();
            setEditCampaignId(null);
            setFormData({ title: '', description: '', status_id: '', start_date: '', end_date: '', location: '' });
            toast.success('کمپین با موفقیت ویرایش شد', { toastId: 'updateCampaign' });
        } catch (err) {
            console.error('خطا در ویرایش کمپین:', err);
            toast.error(err.message || 'خطا در ویرایش کمپین', { toastId: 'updateCampaignError' });
        }
    };

    const handleDeleteCampaign = async (campaign_id) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این کمپین را حذف کنید؟')) return;
        try {
            await sendRequest(`${env.baseUrl}api/destroyCampaign`, 'POST', { campaign_id });
            await fetchAllCampaigns();
            toast.success('کمپین با موفقیت حذف شد', { toastId: 'deleteCampaign' });
        } catch (err) {
            console.error('خطا در حذف کمپین:', err);
            toast.error(err.message || 'خطا در حذف کمپین', { toastId: 'deleteCampaignError' });
        }
    };

    const handleJoinCampaign = async (campaign_id) => {
        const result = await sendRequest(`${env.baseUrl}api/campaigns/join`, 'POST', { campaign_id });
        if (result.success === false && result.message === 'شما قبلاً به این کمپین پیوسته‌اید.') {
            toast.info('شما قبلاً به این کمپین پیوسته‌اید.', { toastId: 'joinCampaignInfo' });
        } else if (result.success !== false) {
            toast.success('با موفقیت به کمپین پیوستید', { toastId: 'joinCampaign' });
        } else {
            console.error('خطا در پیوستن به کمپین:', result.message);
            toast.error(result.message || 'خطا در پیوستن به کمپین', { toastId: 'joinCampaignError' });
        }
    };

    const handleStartPayment = async (campaign_id, amount) => {
        if (!amount || amount <= 0) {
            toast.error('لطفاً مبلغ معتبر وارد کنید', { toastId: 'startPaymentInvalid' });
            return;
        }
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaigns/startPayment`, 'POST', {
                campaign_id,
                amount: parseFloat(amount),
            });
            if (result.status && result.payment_url) {
                toast.success('در حال انتقال به درگاه پرداخت...', { toastId: 'startPayment' });
                window.location.href = result.payment_url;
            } else {
                throw new Error('لینک پرداخت دریافت نشد');
            }
        } catch (err) {
            console.error('خطا در شروع پرداخت:', err);
            toast.error(err.message || 'خطا در شروع پرداخت', { toastId: 'startPaymentError' });
        }
    };

    useEffect(() => {
        checkUserRole();
        fetchStatuses();
        fetchCampaigns();

        const handleStorageChange = () => checkUserRole();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [selectedStatus]);

    return (
        <div className={styles.campaigns}>
            <ToastContainer
                rtl
                position="bottom-right"
                autoClose={3000}
                limit={1}
                hideProgressBar
                newestOnTop
                closeOnClick
                pauseOnHover
            />
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${activeTab === 'viewCampaigns' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('viewCampaigns')}
                >
                    مشاهده کمپین‌ها
                </button>
                {isAdmin && (
                    <button
                        className={`${styles.tab} ${activeTab === 'createCampaign' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('createCampaign')}
                    >
                        ایجاد کمپین جدید
                    </button>
                )}
            </div>
            <div className={styles.tabContent}>
                {activeTab === 'viewCampaigns' && (
                    <CampaignList
                        campaigns={campaigns}
                        statuses={statuses}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        isAdmin={isAdmin}
                        fetchCampaigns={fetchCampaigns}
                        fetchCampaignDetails={fetchCampaignDetails}
                        fetchParticipants={fetchParticipants}
                        handleJoinCampaign={handleJoinCampaign}
                        handleStartPayment={handleStartPayment}
                        handleDeleteCampaign={handleDeleteCampaign}
                        setEditCampaignId={setEditCampaignId}
                        setFormData={setFormData}
                        setActiveTab={setActiveTab}
                    />
                )}
                {activeTab === 'createCampaign' && isAdmin && (
                    <CampaignForm
                        formData={formData}
                        setFormData={setFormData}
                        statuses={statuses}
                        editCampaignId={editCampaignId}
                        handleCreateCampaign={handleCreateCampaign}
                        handleUpdateCampaign={handleUpdateCampaign}
                        fetchCampaignDetails={fetchCampaignDetails}
                        fetchParticipants={fetchParticipants}
                    />
                )}
            </div>
        </div>
    );
};

export default Campaigns;