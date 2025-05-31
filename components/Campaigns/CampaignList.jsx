import { useState } from 'react';
import styles from './Campaigns.module.css';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from './Modal';
import moment from 'moment-jalaali';

// تابع کمکی برای فرمت تاریخ جلالی
const formatJalaaliDate = (dateString) => {
    console.log('Input date:', dateString);
    if (!dateString) return 'نامشخص';
    const date = moment(dateString, 'jYYYY-jMM-jDD');
    console.log('Parsed date:', date.isValid() ? date.format('jYYYY/jMM/jDD') : 'Invalid');
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

    const getStatusText = (campaign, statuses) => {
        // اگر campaign.status یه رشته است
        if (typeof campaign?.status === "string") {
            switch (campaign?.status.toLowerCase()) {
                case "active":
                    return "فعال";
                case "upcoming":
                    return "آینده";
                case "ended":
                    return "پایان‌یافته";
                case "paused":
                    return "متوقف";
                default:
                    return "نامشخص";
            }
        }
        // اگر campaign.status یه شیء است
        if (campaign?.status && typeof campaign?.status === "object" && campaign?.status?.status) {
            switch (campaign?.status?.status.toLowerCase()) {
                case "active":
                    return "فعال";
                case "upcoming":
                    return "آینده";
                case "ended":
                    return "پایان‌یافته";
                case "paused":
                    return "متوقف";
                default:
                    return "نامشخص";
            }
        }
        // اگر status_id وجود داره
        if (campaign?.status_id && statuses?.length) {
            const statusObj = statuses.find((s) => s.id === campaign.status_id);
            if (statusObj) {
                switch (statusObj.status.toLowerCase()) {
                    case "active":
                        return "فعال";
                    case "upcoming":
                        return "آینده";
                    case "ended":
                        return "پایان‌یافته";
                    case "paused":
                        return "متوقف";
                    default:
                        return "نامشخص";
                }
            }
        }
        return "نامشخص";
    };

    const handlePaymentInputChange = (e, campaign_id) => {
        const { value } = e.target;
        setPaymentData({ campaign_id, amount: value });
    };

    const handleOpenDetailsModal = async (campaign_id) => {
        try {
            const result = await fetchCampaignDetails(campaign_id);
            setSelectedCampaign(result.campaign);
            setIsDetailsModalOpen(true);
        } catch (err) {
            toast.error('خطا در دریافت جزئیات کمپین', { toastId: 'openDetailsModal' });
        }
    };

    const handleOpenParticipantsModal = async (campaign_id) => {
        try {
            const result = await fetchParticipants(campaign_id);
            setParticipants(result.participants || []);
            setIsParticipantsModalOpen(true);
        } catch (err) {
            toast.error('خطا در دریافت شرکت‌کنندگان', { toastId: 'openParticipantsModal' });
        }
    };

    const handlePaymentSubmit = async () => {
        if (!paymentData.amount || paymentData.amount <= 0) {
            toast.error('لطفاً مبلغ معتبر وارد کنید', { toastId: 'paymentSubmitInvalid' });
            return;
        }
        try {
            await handleStartPayment(paymentData.campaign_id, paymentData.amount);
            setPaymentData({ campaign_id: '', amount: '' });
        } catch (err) {
            toast.error(err.message || 'خطا در شروع پرداخت', { toastId: 'paymentSubmit' });
        }
    };

    const handleEdit = async (campaign_id) => {
        try {
            const result = await fetchCampaignDetails(campaign_id);
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
            toast.error('خطا در دریافت اطلاعات کمپین برای ویرایش', { toastId: 'editCampaign' });
        }
    };

    return (
        <div>
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
                                <p><strong>محل:</strong> {campaign.location || 'نامشخص'}</p>
                                <p>
                                    <strong>شروع:</strong> {formatJalaaliDate(campaign.start_date)}
                                </p>
                                <p>
                                    <strong>پایان:</strong> {formatJalaaliDate(campaign.end_date)}
                                </p>
                                <p><strong>وضعیت:</strong> {getStatusText(campaign)}</p>
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
                        <p><strong>توضیحات:</strong> {selectedCampaign.description || 'بدون توضیحات'}</p>
                        <p><strong>محل:</strong> {selectedCampaign.location || 'نامشخص'}</p>
                        <p><strong>وضعیت:</strong> {getStatusText(selectedCampaign)}</p>
                        <p>
                            <strong>شروع:</strong> {formatJalaaliDate(selectedCampaign.start_date)}
                        </p>
                        <p>
                            <strong>پایان:</strong> {formatJalaaliDate(selectedCampaign.end_date)}
                        </p>
                        <p>
                            <strong>تعداد شرکت‌کنندگان:</strong>{' '}
                            {selectedCampaign.participants?.length || 0}
                        </p>
                        <p><strong>مجموع کمک‌ها:</strong> {selectedCampaign.total_donations || 0} تومان</p>
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