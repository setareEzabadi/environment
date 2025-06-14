import { useState, useEffect } from 'react';
import styles from './Campaigns.module.css';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from './Modal';
import moment from 'moment-jalaali';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMomentJalaali } from '@mui/x-date-pickers/AdapterMomentJalaali';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
import env from '../../env';

const formatJalaaliDate = (dateString) => {
    if (!dateString) return 'نامشخص';
    const date = moment(dateString, 'jYYYY-jMM-jDD');
    return date.isValid() ? date.format('jYYYY/jMM/jDD') : 'تاریخ نامعتبر';
};

const CampaignList = ({
    campaigns,
    statuses,
    selectedStatus,
    setSelectedStatus,
    isAdmin,
    fetchCampaigns,
    fetchCampaignDetails,
    fetchParticipants,
    handleJoinCampaign,
    handleStartPayment,
    handleDeleteCampaign,
    setEditCampaignId,
    setFormData,
    setActiveTab,
}) => {
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ campaign_id: '', amount: '' });
    const [dynamicFilterValues, setDynamicFilterValues] = useState({});
    const [filterOptions, setFilterOptions] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filteredCampaigns, setFilteredCampaigns] = useState(campaigns); // State محلی جدید

    // همگام‌سازی filteredCampaigns با campaigns وقتی campaigns تغییر می‌کنه
    useEffect(() => {
        setFilteredCampaigns(campaigns);
    }, [campaigns]);

    const getStatusText = (campaign, statuses) => {
        if (typeof campaign?.status === 'string') {
            switch (campaign?.status.toLowerCase()) {
                case 'active':
                    return 'فعال';
                case 'upcoming':
                    return 'در انتظار شروع';
                case 'ended':
                    return 'پایان‌یافته';
                case 'paused':
                    return 'متوقف';
                default:
                    return 'نامشخص';
            }
        }
        if (campaign?.status && typeof campaign?.status === 'object' && campaign?.status?.status) {
            switch (campaign?.status?.status.toLowerCase()) {
                case 'active':
                    return 'فعال';
                case 'upcoming':
                    return 'در انتظار شروع';
                case 'ended':
                    return 'پایان‌یافته';
                case 'paused':
                    return 'متوقف';
                default:
                    return 'نامشخص';
            }
        }
        if (campaign?.status_id && statuses?.length) {
            const statusObj = statuses.find((s) => s.id === campaign.status_id);
            if (statusObj) {
                switch (statusObj.status.toLowerCase()) {
                    case 'active':
                        return 'فعال';
                    case 'upcoming':
                        return 'در انتظار شروع';
                    case 'ended':
                        return 'پایان‌یافته';
                    case 'paused':
                        return 'متوقف';
                    default:
                        return 'نامشخص';
                }
            }
        }
        return 'نامشخص';
    };

    const handlePaymentInputChange = (e, campaign_id) => {
        const { value } = e.target;
        setPaymentData({ campaign_id, amount: value });
    };

    const handleOpenDetailsModal = async (campaign_id) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/getCampaign?campaign_id=${campaign_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
            setSelectedCampaign(result.campaign);
            setIsDetailsModalOpen(true);
        } catch (err) {
            toast.error(err.message || 'خطا در دریافت جزئیات کمپین');
        }
    };

    const handleOpenParticipantsModal = async (campaign_id) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/campaigns/participants?campaign_id=${campaign_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
            setParticipants(result.participants || []);
            setIsParticipantsModalOpen(true);
        } catch (err) {
            toast.error(err.message || 'خطا در دریافت شرکت‌کنندگان');
        }
    };

    const handlePaymentSubmit = async () => {
        if (!paymentData.amount || paymentData.amount <= 0) {
            toast.error('لطفاً مبلغ معتبر وارد کنید');
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/campaigns/startPayment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    campaign_id: paymentData.campaign_id,
                    amount: parseFloat(paymentData.amount),
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
            if (result.status && result.payment_url) {
                toast.success('در حال انتقال به درگاه پرداخت...');
                window.location.href = result.payment_url;
            } else {
                throw new Error('لینک پرداخت دریافت نشد');
            }
            setPaymentData({ campaign_id: '', amount: '' });
        } catch (err) {
            toast.error(err.message || 'خطا در شروع پرداخت');
        }
    };

    const handleEdit = async (campaign_id) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/getCampaign?campaign_id=${campaign_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
            setFormData({
                title: result.campaign.title,
                description: result.campaign.description,
                status_id: result.campaign.status_id,
                start_date: result.campaign.start_date,
                end_date: result.campaign.end_date,
                location: result.campaign.location,
            });
            setEditCampaignId(campaign_id);
            setActiveTab('createCampaign');
        } catch (err) {
            toast.error('خطا در دریافت اطلاعات کمپین برای ویرایش');
        }
    };

    const fetchFilterOptions = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        setLoadingFilters(true);
        try {
            const response = await fetch('${env.baseUrl}api/CampaignFilterOptions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
            const ops = Array.isArray(result.filters) ? result.filters : [];
            setFilterOptions(ops);
            const initialValues = {};
            ops.forEach((f) => {
                initialValues[f.key] = '';
            });
            setDynamicFilterValues(initialValues);
        } catch (err) {
            toast.error(err.message || 'خطا در دریافت گزینه‌های فیلتر');
        } finally {
            setLoadingFilters(false);
        }
    };

    const performDynamicSearch = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        setLoading(true);
        try {
            const url = new URL('${env.baseUrl}api/searchCampaigns');
            Object.entries(dynamicFilterValues).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    url.searchParams.append(key, value);
                }
            });
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
            setFilteredCampaigns(Array.isArray(result.data) ? result.data : []); // استفاده از state محلی
            toast.success('کمپین‌ها با موفقیت فیلتر شدند');
        } catch (err) {
            toast.error(err.message || 'خطا در جستجوی داینامیک');
            setFilteredCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDynamicFilterChange = (key, rawValue) => {
        setDynamicFilterValues((prev) => ({
            ...prev,
            [key]: rawValue,
        }));
    };

    useEffect(() => {
        fetchCampaigns();
        if (isAdmin) {
            fetchFilterOptions();
        }
    }, [isAdmin]);

    return (
        <div>
            {!isAdmin && (
                <section className={styles.filterSection}>
                    <h3>فیلتر کمپین‌ها</h3>
                    <div className={styles.filterControls}>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="">همه وضعیت‌ها</option>
                            {statuses.length > 0 ? (
                                statuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {getStatusText({ status: status.status }, statuses)}
                                    </option>
                                ))
                            ) : (
                                <option disabled>در حال بارگذاری...</option>
                            )}
                        </select>
                        <button onClick={fetchCampaigns} className={styles.searchBtn}>
                            جستجو
                        </button>
                    </div>
                </section>
            )}

            {isAdmin && (
                <section className={styles.dynamicFilterSection}>
                    <div className={styles.filterHeader}>
                        <h3>فیلتر نیمه پویا کمپین‌ها</h3>
                    </div>
                    {loadingFilters && filterOptions.length === 0 ? (
                        <div className={styles.loader}>در حال بارگذاری گزینه‌های فیلتر...</div>
                    ) : filterOptions.length === 0 ? (
                        <p className={styles.noFilters}>گزینه‌ای برای فیلتر یافت نشد.</p>
                    ) : (
                        <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
                            <div className={styles.dynamicFilterControls}>
                                {filterOptions.map((f) => {
                                    const { key, label, type, options } = f;
                                    const rawValue = dynamicFilterValues[key] ?? '';

                                    if (type === 'select') {
                                        return (
                                            <div key={key} className={styles.dynamicFilterItem}>
                                                <label htmlFor={key} className={styles.filterLabel}>
                                                    {label}
                                                </label>
                                                <select
                                                    id={key}
                                                    name={key}
                                                    value={rawValue}
                                                    onChange={(e) => handleDynamicFilterChange(key, e.target.value)}
                                                    className={styles.dynamicFilterSelect}
                                                >
                                                    <option value="">انتخاب کنید</option>
                                                    {Array.isArray(options) &&
                                                        options.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {key === 'status_id'
                                                                    ? getStatusText({ status: opt.label }, statuses)
                                                                    : opt.label}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        );
                                    }

                                    if (type === 'text') {
                                        return (
                                            <div key={key} className={styles.dynamicFilterItem}>
                                                <label htmlFor={key} className={styles.filterLabel}>
                                                    {label}
                                                </label>
                                                <input
                                                    id={key}
                                                    name={key}
                                                    type="text"
                                                    value={rawValue}
                                                    onChange={(e) => handleDynamicFilterChange(key, e.target.value)}
                                                    placeholder={`جستجو بر اساس ${label}`}
                                                    className={styles.dynamicFilterInput}
                                                />
                                            </div>
                                        );
                                    }

                                    if (type === 'date') {
                                        const pickerValue = rawValue ? moment(rawValue, 'YYYY-MM-DD') : null;
                                        return (
                                            <div key={key} className={styles.dynamicFilterItem}>
                                                <label htmlFor={key} className={styles.filterLabel}>
                                                    {label}
                                                </label>
                                                <MuiDatePicker
                                                    value={pickerValue}
                                                    onChange={(date) => {
                                                        const val = date ? date.format('YYYY-MM-DD') : '';
                                                        handleDynamicFilterChange(key, val);
                                                    }}
                                                    inputFormat="jYYYY/jMM/jDD"
                                                    mask="____/__/__"
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            className={styles.datePickerInput}
                                                            placeholder="انتخاب تاریخ"
                                                            size="small"
                                                        />
                                                    )}
                                                />
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                <div className={styles.filterActions}>
                                    <button onClick={performDynamicSearch} className={styles.searchBtn}>
                                        جستجوی
                                    </button>
                                    <button
                                        onClick={() => {
                                            const initialValues = {};
                                            filterOptions.forEach((f) => {
                                                initialValues[f.key] = '';
                                            });
                                            setDynamicFilterValues(initialValues);
                                            setFilteredCampaigns(campaigns); // بازنشانی به کمپین‌های اصلی
                                        }}
                                        className={styles.resetBtn}
                                    >
                                        ریست
                                    </button>
                                </div>
                            </div>
                        </LocalizationProvider>
                    )}
                </section>
            )}

            <section className={styles.campaignsSection}>
                <h3>لیست کمپین‌ها</h3>
                {loading ? (
                    <div className={styles.loader}>در حال بارگذاری...</div>
                ) : (
                    <div className={styles.campaignsList}>
                        {filteredCampaigns.length === 0 ? (
                            <p className={styles.noCampaigns}>کمپینی یافت نشد</p>
                        ) : (
                            filteredCampaigns.map((campaign) => (
                                <div key={campaign.id} className={styles.campaignCard}>
                                    <h4>{campaign.title || 'بدون عنوان'}</h4>
                                    <p className={styles.description}>{campaign.description || 'بدون توضیحات'}</p>
                                    <p>
                                        <strong>محل:</strong> {campaign.location || 'نامشخص'}
                                    </p>
                                    <p>
                                        <strong>شروع:</strong> {formatJalaaliDate(campaign.start_date)}
                                    </p>
                                    <p>
                                        <strong>پایان:</strong> {formatJalaaliDate(campaign.end_date)}
                                    </p>
                                    <p>
                                        <strong>وضعیت:</strong> {getStatusText(campaign)}
                                    </p>
                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => handleOpenDetailsModal(campaign.id)}
                                            className={styles.detailsBtn}
                                        >
                                            جزئیات
                                        </button>
                                        <button
                                            onClick={() => handleOpenParticipantsModal(campaign.id)}
                                            className={styles.participantsBtn}
                                        >
                                            شرکت‌کنندگان
                                        </button>
                                        <button
                                            onClick={() => handleJoinCampaign(campaign.id)}
                                            className={styles.joinBtn}
                                        >
                                            پیوستن به کمپین
                                        </button>
                                        <div className={styles.paymentForm}>
                                            <input
                                                type="number"
                                                name="amount"
                                                placeholder="مبلغ حمایت (تومان)"
                                                value={paymentData.campaign_id === campaign.id ? paymentData.amount : ''}
                                                onChange={(e) => handlePaymentInputChange(e, campaign.id)}
                                                className={styles.paymentInput}
                                            />
                                            <button
                                                onClick={handlePaymentSubmit}
                                                className={styles.paymentBtn}
                                                disabled={
                                                    !paymentData.amount ||
                                                    paymentData.amount <= 0 ||
                                                    paymentData.campaign_id !== campaign.id
                                                }
                                            >
                                                حمایت مالی
                                            </button>
                                        </div>
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => handleEdit(campaign.id)} className={styles.editBtn}>
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
                )}
            </section>

            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedCampaign(null);
                }}
                title={selectedCampaign ? `جزئیات کمپین: ${selectedCampaign.title}` : 'جزئیات کمپین'}
            >
                {selectedCampaign ? (
                    <>
                        <p>
                            <strong>توضیحات:</strong> {selectedCampaign.description || 'بدون توضیحات'}
                        </p>
                        <p>
                            <strong>محل:</strong> {selectedCampaign.location || 'نامشخص'}
                        </p>
                        <p>
                            <strong>وضعیت:</strong> {getStatusText(selectedCampaign)}
                        </p>
                        <p>
                            <strong>شروع:</strong> {formatJalaaliDate(selectedCampaign.start_date)}
                        </p>
                        <p>
                            <strong>پایان:</strong> {formatJalaaliDate(selectedCampaign.end_date)}
                        </p>
                        <p>
                            <strong>تعداد شرکت‌کنندگان:</strong> {selectedCampaign.participants?.length || 0}
                        </p>
                        <p>
                            <strong>مجموع کمک‌ها:</strong> {selectedCampaign.total_donations || 0} تومان
                        </p>
                        <div className={styles.paymentForm}>
                            <input
                                type="number"
                                name="amount"
                                placeholder="مبلغ حمایت (تومان)"
                                value={paymentData.campaign_id === selectedCampaign.id ? paymentData.amount : ''}
                                onChange={(e) => handlePaymentInputChange(e, selectedCampaign.id)}
                                className={styles.paymentInput}
                            />
                            <button
                                onClick={handlePaymentSubmit}
                                className={styles.paymentBtn}
                                disabled={
                                    !paymentData.amount ||
                                    paymentData.amount <= 0 ||
                                    paymentData.campaign_id !== selectedCampaign.id
                                }
                            >
                                حمایت مالی
                            </button>
                        </div>
                    </>
                ) : (
                    <p>در حال بارگذاری...</p>
                )}
            </Modal>

            <Modal
                isOpen={isParticipantsModalOpen}
                onClose={() => {
                    setIsParticipantsModalOpen(false);
                    setParticipants([]);
                }}
                title="شرکت‌کنندگان"
            >
                {participants.length > 0 ? (
                    <ul className={styles.participantList}>
                        {participants.map((participant, index) => (
                            <li key={index}>
                                {participant.name || 'کاربر ناشناس'} - کمک: {participant.donated || 0} تومان
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>هیچ شرکت‌کننده‌ای یافت نشد</p>
                )}
            </Modal>
        </div>
    );
};

export default CampaignList;