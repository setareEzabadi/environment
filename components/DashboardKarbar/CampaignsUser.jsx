import { useState, useEffect } from "react";
import styles from "./DashboardKarbar.module.css";
import env from "../../env";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../Campaigns/Modal";
import CampaignList from "../Campaigns/CampaignList";
import CampaignForm from "../Campaigns/CampaignForm";
import { FaTrash, FaEdit } from "react-icons/fa";
import moment from "moment-jalaali";

const CampaignsUser = () => {
    const [userCampaigns, setUserCampaigns] = useState([]);
    const [donations, setDonations] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status_id: "",
        start_date: "",
        end_date: "",
        location: "",
    });
    const [editCampaignId, setEditCampaignId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState("viewCampaigns");
    const [loading, setLoading] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ campaign_id: "", amount: "" });

    // چک کردن نقش کاربر
    const checkUserRole = () => {
        const userData = localStorage.getItem("auth_user");
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                const isAdminUser = parsedUser.role && parsedUser.role.toLowerCase() === "admin";
                setIsAdmin(isAdminUser);
            } catch (err) {
                console.error("خطا در پارس داده کاربر:", err);
                toast.error("خطا در بارگذاری اطلاعات کاربر", { toastId: "checkUserRole" });
            }
        }
    };

    // تابع کمکی برای ارسال درخواست‌ها
    const sendRequest = async (url, method = "GET", body = null) => {
        const token = localStorage.getItem("auth_token");
        if (!token) throw new Error("توکن احراز هویت یافت نشد");

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                toast.error("لطفاً دوباره وارد شوید");
                setTimeout(() => (window.location.href = "/login"), 3000);
                return;
            }
            if (result.message === "شما قبلاً به این کمپین پیوسته‌اید.") {
                return { success: false, message: result.message };
            }
            throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
        }
        return result;
    };

    // فرمت تاریخ شمسی
    const formatJalaaliDate = (dateString) => {
        if (!dateString) return "نامشخص";
        const date = moment(dateString, ["YYYY-MM-DD", "jYYYY-jMM-jDD"], true);
        return date.isValid() ? date.format("jYYYY/jMM/jDD") : "تاریخ نامعتبر";
    };

    // تابع نمایش وضعیت کمپین
    const getStatusText = (campaign, statuses) => {
        if (typeof campaign.status === "string") {
            switch (campaign.status.toLowerCase()) {
                case "active":
                    return "فعال";
                case "upcoming":
                    return "در انتظار شروع";
                case "ended":
                    return "پایان‌یافته";
                case "paused":
                    return "متوقف";
                default:
                    return "نامشخص";
            }
        }
        if (campaign.status && typeof campaign.status === "object" && campaign.status.status) {
            switch (campaign.status.status.toLowerCase()) {
                case "active":
                    return "فعال";
                case "upcoming":
                    return "در انتظار شروع";
                case "ended":
                    return "پایان‌یافته";
                case "paused":
                    return "متوقف";
                default:
                    return "نامشخص";
            }
        }
        if (campaign.status_id && statuses.length) {
            const statusObj = statuses.find((s) => s.id === campaign.status_id);
            if (statusObj) {
                switch (statusObj.status.toLowerCase()) {
                    case "active":
                        return "فعال";
                    case "upcoming":
                        return "در انتظار شروع";
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

    // تابع نمایش وضعیت کمک مالی
    const getDonationStatusText = (status) => {
        switch (status) {
            case "در انتظار پرداخت":
                return { text: "در انتظار پرداخت", className: styles.statusPending };
            case "تکمیل‌شده":
                return { text: "تکمیل‌شده", className: styles.statusCompleted };
            case "لغو‌شده":
                return { text: "لغو‌شده", className: styles.statusCancelled };
            default:
                return { text: "نامشخص", className: styles.statusUnknown };
        }
    };

    // دریافت کمپین‌های کاربر معمولی
    const fetchUserCampaigns = async () => {
        setLoading(true);
        try {
            const result = await sendRequest(`${env.baseUrl}api/user/campaigns`);
            console.log("User campaigns:", result);
            setUserCampaigns(Array.isArray(result.data) ? result.data : []);
            toast.success("کمپین‌های شما با موفقیت دریافت شدند", { toastId: "user-campaigns-success" });
        } catch (err) {
            console.error("خطا در دریافت کمپین‌های کاربر:", err);
            toast.error(err.message || "خطا در دریافت کمپین‌های کاربر");
        } finally {
            setLoading(false);
        }
    };

    // دریافت کمک‌های مالی کاربر
    const fetchDonations = async () => {
        setLoading(true);
        try {
            const result = await sendRequest(`${env.baseUrl}api/myDonates`);
            console.log("User donations:", result);
            setDonations(Array.isArray(result.data) ? result.data : []);
            toast.success("کمک‌های مالی شما با موفقیت دریافت شدند", { toastId: "donations-success" });
        } catch (err) {
            console.error("خطا در دریافت کمک‌های مالی:", err);
            toast.error(err.message || "خطا در دریافت کمک‌های مالی");
        } finally {
            setLoading(false);
        }
    };

    // دریافت همه کمپین‌ها (برای ادمین)
    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const statusFilter = selectedStatus ? `?status_id=${selectedStatus}` : "";
            const result = await sendRequest(`${env.baseUrl}api/CampaignFillter${statusFilter}`);
            console.log("All campaigns:", result);
            setCampaigns(Array.isArray(result.data) ? result.data : []);
            toast.success("کمپین‌ها با موفقیت دریافت شدند");
        } catch (err) {
            console.error("خطا در دریافت کمپین‌ها:", err);
            toast.error(err.message || "خطا در دریافت کمپین‌ها");
        } finally {
            setLoading(false);
        }
    };

    // دریافت وضعیت‌ها (برای ادمین)
    const fetchStatuses = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaign-statuses`);
            setStatuses(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            console.error("خطا در دریافت وضعیت‌ها:", err);
            toast.error(err.message || "خطا در دریافت وضعیت‌ها");
        }
    };

    // دریافت جزئیات کمپین
    const fetchCampaignDetails = async (campaign_id) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCampaign?campaign_id=${campaign_id}`);
            console.log("Campaign details:", result);
            setSelectedCampaign(result.campaign);
            setParticipants(result.campaign.participants || []);
            return result;
        } catch (err) {
            console.error("خطا در دریافت جزئیات کمپین:", err);
            toast.error(err.message || "خطا در دریافت جزئیات کمپین");
            throw err;
        }
    };

    // دریافت شرکت‌کنندگان
    const fetchParticipants = async (campaign_id) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaigns/participants?campaign_id=${campaign_id}`);
            setParticipants(result.participants || []);
            return result;
        } catch (err) {
            console.error("خطا در دریافت شرکت‌کنندگان:", err);
            toast.error(err.message || "خطا در دریافت شرکت‌کنندگان");
            throw err;
        }
    };

    // ایجاد کمپین
    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            await sendRequest(`${env.baseUrl}api/storecampaign`, "POST", formData);
            await fetchCampaigns();
            setFormData({ title: "", description: "", status_id: "", start_date: "", end_date: "", location: "" });
            toast.success("کمپین با موفقیت ایجاد شد");
        } catch (err) {
            console.error("خطا در ایجاد کمپین:", err);
            toast.error(err.message || "خطا در ایجاد کمپین");
        }
    };

    // ویرایش کمپین
    const handleUpdateCampaign = async (e) => {
        e.preventDefault();
        try {
            await sendRequest(`${env.baseUrl}api/updateCampaign`, "POST", {
                campaign_id: editCampaignId,
                ...formData,
            });
            await fetchCampaigns();
            setEditCampaignId(null);
            setFormData({ title: "", description: "", status_id: "", start_date: "", end_date: "", location: "" });
            toast.success("کمپین با موفقیت ویرایش شد");
        } catch (err) {
            console.error("خطا در ویرایش کمپین:", err);
            toast.error(err.message || "خطا در ویرایش کمپین");
        }
    };

    // حذف کمپین
    const handleDeleteCampaign = async (campaign_id) => {
        if (!window.confirm("آیا مطمئن هستید که می‌خواهید این کمپین را حذف کنید؟")) return;
        try {
            await sendRequest(`${env.baseUrl}api/destroyCampaign`, "POST", { campaign_id });
            await fetchCampaigns();
            toast.success("کمپین با موفقیت حذف شد");
        } catch (err) {
            console.error("خطا در حذف کمپین:", err);
            toast.error(err.message || "خطا در حذف کمپین");
        }
    };

    // پیوستن به کمپین
    const handleJoinCampaign = async (campaign_id) => {
        const result = await sendRequest(`${env.baseUrl}api/campaigns/join`, "POST", { campaign_id });
        if (result.success === false && result.message === "شما قبلاً به این کمپین پیوسته‌اید.") {
            toast.info("شما قبلاً به این کمپین پیوسته‌اید.");
        } else if (result.success !== false) {
            toast.success("با موفقیت به کمپین پیوستید");
            fetchUserCampaigns();
        } else {
            console.error("خطا در پیوستن به کمپین:", result.message);
            toast.error(result.message || "خطا در پیوستن به کمپین");
        }
    };

    // حمایت مالی
    const handleStartPayment = async (campaign_id, amount) => {
        if (!amount || amount <= 0) {
            toast.error("لطفاً مبلغ معتبر وارد کنید");
            return;
        }
        try {
            const result = await sendRequest(`${env.baseUrl}api/campaigns/startPayment`, "POST", {
                campaign_id,
                amount: parseFloat(amount),
            });
            if (result.status && result.payment_url) {
                toast.success("در حال انتقال به درگاه پرداخت...");
                window.location.href = result.payment_url;
                // به‌روزرسانی کمک‌های مالی پس از پرداخت موفق
                setTimeout(fetchDonations, 2000); // فراخوانی با تاخیر برای اطمینان از تکمیل پرداخت
            } else {
                throw new Error("لینک پرداخت دریافت نشد");
            }
        } catch (err) {
            console.error("خطا در شروع پرداخت:", err);
            toast.error(err.message || "خطا در شروع پرداخت");
        }
    };

    // مدیریت ورودی حمایت مالی
    const handlePaymentInputChange = (e, campaign_id) => {
        const { value } = e.target;
        setPaymentData({ campaign_id, amount: value });
    };

    // ارسال حمایت مالی
    const handlePaymentSubmit = async () => {
        if (!paymentData.amount || paymentData.amount <= 0) {
            toast.error("لطفاً مبلغ معتبر وارد کنید");
            return;
        }
        try {
            await handleStartPayment(paymentData.campaign_id, paymentData.amount);
            setPaymentData({ campaign_id: "", amount: "" });
        } catch (err) {
            toast.error(err.message || "خطا در شروع پرداخت");
        }
    };

    useEffect(() => {
        checkUserRole();
        if (isAdmin) {
            fetchStatuses();
            fetchCampaigns();
        } else {
            fetchUserCampaigns();
            fetchDonations();
        }
    }, [isAdmin, selectedStatus]);

    // کامپوننت برای نمایش کمپین‌های کاربر معمولی
    const UserCampaignList = () => (
        <div>
            <h3 className={styles.sectionTitle}>کمپین‌های شرکت‌شده</h3>
            <p className={styles.sectionSubtitle}>لیست کمپین‌هایی که در آن‌ها شرکت کرده‌اید.</p>
            {loading ? (
                <div className={styles.loader}>در حال بارگذاری...</div>
            ) : (
                <div className={styles.campaignList}>
                    {userCampaigns.length === 0 ? (
                        <p className={styles.noCampaigns}>شما در هیچ کمپینی شرکت نکرده‌اید.</p>
                    ) : (
                        userCampaigns.map((campaign) => (
                            <div key={campaign.id} className={styles.campaignCard}>
                                <h4>{campaign.title || "بدون عنوان"}</h4>
                                <p className={styles.description}>{campaign.description || "بدون توضیحات"}</p>
                                <p>
                                    <strong>محل:</strong> {campaign.location || "نامشخص"}
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
                            </div>
                        ))
                    )}
                </div>
            )}
            <h3 className={styles.sectionTitle}>کمک‌های مالی شما</h3>
            <p className={styles.sectionSubtitle}>لیست کمک‌های مالی که برای کمپین‌ها انجام داده‌اید.</p>
            {loading ? (
                <div className={styles.loader}>در حال بارگذاری...</div>
            ) : (
                <div className={styles.donationList}>
                    {donations.length === 0 ? (
                        <p className={styles.noDonations}>شما هیچ کمک مالی ثبت نکرده‌اید.</p>
                    ) : (
                        donations.map((donation) => (
                            <div key={donation.id} className={styles.donationCard}>
                                <div className={styles.donationHeader}>
                                    <h4>{donation.campaign.title || "کمپین نامشخص"}</h4>
                                    <span className={getDonationStatusText(donation.status).className}>
                                        {getDonationStatusText(donation.status).text}
                                    </span>
                                </div>
                                <p className={styles.donationDescription}>
                                    {donation.campaign.description || "بدون توضیحات"}
                                </p>
                                <p>
                                    <strong>مبلغ:</strong>{" "}
                                    {parseFloat(donation.amount).toLocaleString("fa-IR")} تومان
                                </p>
                                <p>
                                    <strong>تاریخ:</strong> {formatJalaaliDate(donation.created_at)}
                                </p>
                                <p>
                                    <strong>شماره رهگیری:</strong> {donation.track_id || "نامشخص"}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className={styles.campaignsUser}>
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
            {isAdmin ? (
                <>
                    <div className={styles.tabContainer}>
                        <button
                            className={`${styles.tab} ${activeTab === "viewCampaigns" ? styles.activeTab : ""}`}
                            onClick={() => setActiveTab("viewCampaigns")}
                        >
                            مشاهده کمپین‌ها
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === "createCampaign" ? styles.activeTab : ""}`}
                            onClick={() => setActiveTab("createCampaign")}
                        >
                            ایجاد کمپین جدید
                        </button>
                    </div>
                    <div className={styles.tabContent}>
                        {activeTab === "viewCampaigns" && (
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
                        {activeTab === "createCampaign" && (
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
                </>
            ) : (
                <UserCampaignList />
            )}

            {/* مودال جزئیات */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedCampaign(null);
                }}
                title={selectedCampaign ? `جزئیات کمپین: ${selectedCampaign.title}` : "جزئیات کمپین"}
            >
                {selectedCampaign ? (
                    <>
                        <p>
                            <strong>توضیحات:</strong> {selectedCampaign.description || "بدون توضیحات"}
                        </p>
                        <p>
                            <strong>محل:</strong> {selectedCampaign.location || "نامشخص"}
                        </p>
                        <p>
                            <strong>وضعیت:</strong>{" "}
                            <span
                                className={`${styles.status} ${styles[`status-${selectedCampaign.status?.status || "unknown"}`]}`}
                            >
                                {getStatusText(selectedCampaign)}
                            </span>
                        </p>
                        <p>
                            <strong>شروع:</strong> {formatJalaaliDate(selectedCampaign.start_date)}
                        </p>
                        <p>
                            <strong>پایان:</strong> {formatJalaaliDate(selectedCampaign.end_date)}
                        </p>
                        <p>
                            <strong>تعداد شرکت‌کنندگان:</strong>{" "}
                            {selectedCampaign.participants?.length || 0}
                        </p>
                        <p>
                            <strong>مجموع کمک‌ها:</strong> {selectedCampaign.total_donations || 0} تومان
                        </p>
                        <div className={styles.paymentForm}>
                            <input
                                type="number"
                                name="amount"
                                placeholder="مبلغ حمایت (تومان)"
                                value={paymentData.campaign_id === selectedCampaign.id ? paymentData.amount : ""}
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

            {/* مودال شرکت‌کنندگان */}
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
                                {participant.name || "کاربر ناشناس"} - کمک: {participant.donated || 0} تومان
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

export default CampaignsUser;