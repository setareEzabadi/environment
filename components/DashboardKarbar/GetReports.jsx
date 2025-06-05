import { useState, useEffect } from "react";
import styles from "./DashboardKarbar.module.css";
import env from "../../env";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaPrint, FaInfoCircle, FaPlus, FaMinus, FaQuestionCircle, FaEdit } from "react-icons/fa";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMomentJalaali } from "@mui/x-date-pickers/AdapterMomentJalaali";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "jalali-moment";

const GetReports = () => {
    const [reports, setReports] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({ status: "", category_id: "", sort: "latest" });
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, links: [] });
    const [showHelp, setShowHelp] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [editStatus, setEditStatus] = useState(null); // برای پاپ‌آپ تغییر وضعیت

    const checkUserRole = async () => {
        const userData = localStorage.getItem("auth_user");
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                const isAdminUser = parsedUser.role && parsedUser.role.toLowerCase() === "admin";
                setIsAdmin(isAdminUser);
                return isAdminUser;
            } catch (err) {
                console.error("خطا در پارس داده کاربر:", err);
                setIsAdmin(false);
                setError("خطا در بارگذاری اطلاعات کاربر");
                toast.error("خطا در بارگذاری اطلاعات کاربر");
                return false;
            }
        }
        return false;
    };

    const fetchInitialData = async () => {
        const isAdminUser = await checkUserRole();
        await fetchReports(isAdminUser);
        await fetchCategories();
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const sendRequest = async (url, method = "GET", body = null) => {
        const token = localStorage.getItem("auth_token");
        if (!token) throw new Error("توکن احراز هویت یافت نشد");

        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
        return result;
    };

    const fetchReports = async (isAdminUser) => {
        setLoading(true);
        try {
            const endpoint = isAdminUser ? `${env.baseUrl}api/getReportsAdmin` : `${env.baseUrl}api/user/reports`;
            const result = await sendRequest(endpoint);
            setReports(Array.isArray(result.data) ? result.data : []);
            setPagination({ current_page: 1, last_page: 1, links: [] });
        } catch (err) {
            setError(err.message || "خطا در دریافت گزارش‌ها");
            setReports([]);
            toast.error(err.message || "خطا در دریافت گزارش‌ها");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCategories`);
            setCategories(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            setError(err.message || "خطا در دریافت دسته‌بندی‌ها");
            toast.error(err.message || "خطا در دریافت دسته‌بندی‌ها");
        }
    };

    const fetchReport = async (reportId) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getReport?report_id=${reportId}`);
            return result.data;
        } catch (err) {
            toast.error(err.message || "خطا در دریافت گزارش");
            return null;
        }
    };

    const updateStatus = async (reportId, status, comment, doneAt) => {
        setLoading(true);
        try {
            const result = await sendRequest(`${env.baseUrl}api/updateStatus`, "POST", {
                report_id: reportId,
                status,
                comment,
                done_at: doneAt,
            });
            const updatedReport = await fetchReport(reportId);
            if (isAdmin) {
                setReports(reports.map((r) => (r.id === reportId ? updatedReport : r)));
            } else {
                setReports([updatedReport]);
            }
            toast.success("وضعیت و پاسخ با موفقیت ثبت شد");
        } catch (err) {
            toast.error(err.message || "خطا در به‌روزرسانی وضعیت");
        } finally {
            setLoading(false);
            setEditStatus(null);
        }
    };

    const deleteReport = async (reportId) => {
        if (!window.confirm("آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟")) return;
        try {
            await sendRequest(`${env.baseUrl}api/destroyReport`, "POST", { report_id: reportId });
            setReports(reports.filter((report) => report.id !== reportId));
            toast.success("گزارش با موفقیت حذف شد");
        } catch (err) {
            toast.error(err.message || "خطا در حذف گزارش");
        }
    };

    const storeReportAssistance = async (reportId) => {
        try {
            await sendRequest(`${env.baseUrl}api/storeReportAssistance`, "POST", { report_id: reportId });
            toast.success("داوطلب شدن برای کمک ثبت شد");
        } catch (err) {
            toast.error(err.message || "خطا در ثبت داوطلبی");
        }
    };

    const deleteReportAssistance = async (reportId) => {
        try {
            await sendRequest(`${env.baseUrl}api/deleteReportAssistance`, "POST", { report_id: reportId });
            toast.success("داوطلبی برای کمک لغو شد");
        } catch (err) {
            toast.error(err.message || "خطا در لغو داوطلبی");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const fetchFilteredReports = async (page = 1) => {
        setLoading(true);
        try {
            const url = new URL(`${env.baseUrl}api/reports/filter`);
            url.searchParams.append("page", page);
            if (filters.status) url.searchParams.append("status", filters.status);
            if (filters.category_id) url.searchParams.append("category_id", filters.category_id);
            url.searchParams.append("sort", filters.sort);

            const result = await sendRequest(url.toString());
            setReports(Array.isArray(result.data) ? result.data : []);
            setPagination({
                current_page: result.current_page || 1,
                last_page: result.last_page || 1,
                links: result.links || [],
            });
        } catch (err) {
            setError(err.message || "خطا در فیلتر گزارش‌ها");
            setReports([]);
            setPagination({ current_page: 1, last_page: 1, links: [] });
            toast.error(err.message || "خطا در فیلتر گزارش‌ها");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (report) => report.category?.name || categories.find((cat) => cat.id === report.category_id)?.name || "بدون دسته‌بندی";
    const getRegionName = (report) => report.region?.name || report.region_id || "بدون منطقه";

    const printTable = () => {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html dir="rtl">
                <head><title>چاپ گزارش‌ها</title><style>body{font-family:'iranSans',sans-serif;direction:rtl;padding:20px}h2{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}.statusBadge{padding:6px 12px;border-radius:12px}.pending{background:#fef3c7;color:#d97706}.in_progress{background:#dbeafe;color:#2563eb}.resolved{background:#d1fae5;color:#10b981}</style></head>
                <body><h2>لیست گزارش‌ها</h2><table><thead><tr><th>#</th><th>عنوان</th><th>وضعیت</th><th>دسته‌بندی</th><th>منطقه</th><th>مکان</th><th>تاریخ</th></tr></thead><tbody>${reports.map((report, index) => `<tr><td>${index + 1}</td><td>${report.title || "بدون عنوان"}</td><td><span class="statusBadge ${report.status}">${report.status === "pending" ? "در انتظار" : report.status === "in_progress" ? "در حال انجام" : "حل‌شده"}</span></td><td>${getCategoryName(report)}</td><td>${getRegionName(report)}</td><td>${report.location || "نامشخص"}</td><td>${moment(report.created_at).locale("fa").format("jYYYY/jMM/jDD")}</td></tr>`).join("")}</tbody></table></body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const printReport = (report) => {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html dir="rtl"><head><title>چاپ گزارش ${report.title || "بدون عنوان"}</title><style>body{font-family:'iranSans',sans-serif;direction:rtl;padding:20px}.report{max-width:800px;margin:auto;padding:20px;border-radius:12px}.statusBadge{padding:6px 12px;border-radius:12px}.pending{background:#fef3c7;color:#d97706}.in_progress{background:#dbeafe;color:#2563eb}.resolved{background:#d1fae5;color:#10b981}</style></head>
            <body><div class="report"><h2>${report.title || "بدون عنوان"}</h2><p><strong>وضعیت:</strong><span class="statusBadge ${report.status}">${report.status === "pending" ? "در انتظار" : report.status === "in_progress" ? "در حال انجام" : "حل‌شده"}</span></p><p><strong>توضیحات:</strong>${report.description || "بدون توضیحات"}</p><p><strong>دسته‌بندی:</strong>${getCategoryName(report)}</p><p><strong>منطقه:</strong>${getRegionName(report)}</p><p><strong>مکان:</strong>${report.location || "نامشخص"}</p><p><strong>موقعیت جغرافیایی:</strong>${report.lat}, ${report.long}</p><p><strong>تاریخ ایجاد:</strong>${moment(report.created_at).locale("fa").format("jYYYY/jMM/jDD")}</p>${report.replies && report.replies.length > 0 ? `<p><strong>جواب‌ها:</strong><ul>${report.replies.map(r => `<li>ادمین: ${r.admin.name} ${r.admin.family} - توضیح: ${r.comment || "بدون توضیح"} - تاریخ انجام: ${moment(r.done_at).locale("fa").format("jYYYY/jMM/jDD")}</li>`).join("")}</ul></p>` : "<p>بدون جواب</p>"}</div></body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const openPopup = (report) => setSelectedReport(report);
    const closePopup = () => setSelectedReport(null);
    const openEditStatus = (report) => setEditStatus(report);
    const closeEditStatus = () => setEditStatus(null);

    return (
        <div className={styles.getReports}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />
            <div className={styles.header}>
                <h3>لیست گزارش‌ها</h3>
                <button onClick={() => setShowHelp(!showHelp)} className={styles.helpButton}>
                    <FaQuestionCircle />
                </button>
            </div>
            {showHelp && (
                <div className={styles.helpSection}>
                    <h4>راهنما</h4>
                    <p>گزارش‌های خود را مدیریت کنید.</p>
                    <ul>
                        <li><strong>فیلتر:</strong> گزارش‌ها رو بر اساس وضعیت یا دسته‌بندی فیلتر کنید.</li>
                        <li><strong>داوطلب شدن:</strong> با آیکون + داوطلب کمک شوید.</li>
                        {isAdmin && <li><strong>تغییر وضعیت:</strong> با آیکون ویرایش، وضعیت رو تغییر دهید.</li>}
                    </ul>
                </div>
            )}
            {error && <span className={styles.error}>{error}</span>}

            <section className={styles.filterSection}>
                <h3>فیلتر گزارش‌ها</h3>
                <div className={styles.filterControls}>
                    <select name="status" value={filters.status} onChange={handleFilterChange}>
                        <option value="">همه وضعیت‌ها</option>
                        <option value="pending">در انتظار</option>
                        <option value="in_progress">در حال انجام</option>
                        <option value="resolved">حل‌شده</option>
                    </select>
                    <select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                        <option value="">همه دسته‌بندی‌ها</option>
                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                        <option value="latest">جدیدترین</option>
                        <option value="oldest">قدیمی‌ترین</option>
                    </select>
                    <button onClick={() => fetchFilteredReports(1)} className={styles.searchBtn}>جستجو</button>
                </div>
            </section>

            <section className={styles.reportsSection}>
                <div className={styles.tableHeader}>
                    <h3>لیست گزارش‌ها</h3>
                    <button onClick={printTable} className={styles.printTableBtn}><FaPrint /> چاپ کل جدول</button>
                </div>
                {loading ? (
                    <div className={styles.loader}>در حال بارگذاری...</div>
                ) : (
                    <div className={styles.reportsTable}>
                        {reports.length === 0 ? (
                            <p className={styles.noReports}>گزارشی یافت نشد</p>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>عنوان</th>
                                        <th>وضعیت</th>
                                        <th>دسته‌بندی</th>
                                        <th>منطقه</th>
                                        <th>مکان</th>
                                        <th>تاریخ</th>
                                        <th>جواب‌ها</th>
                                        <th>عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report, index) => (
                                        <tr key={report.id}>
                                            <td>{index + 1}</td>
                                            <td>{report.title || "بدون عنوان"}</td>
                                            <td><span className={`${styles.statusBadge} ${styles[report.status]}`}>{report.status === "pending" ? "در انتظار" : report.status === "in_progress" ? "در حال انجام" : "حل‌شده"}</span></td>
                                            <td>{getCategoryName(report)}</td>
                                            <td>{getRegionName(report)}</td>
                                            <td>{report.location || "نامشخص"}</td>
                                            <td>{moment(report.created_at).locale("fa").format("jYYYY/jMM/jDD")}</td>
                                            <td>
                                                {report.replies && report.replies.length > 0 ? (
                                                    <ul>
                                                        {report.replies.map((reply) => (
                                                            <li key={reply.id}>ادمین: {reply.admin.name} {reply.admin.family} - توضیح: {reply.comment || "بدون توضیح"} - تاریخ: {moment(reply.done_at).locale("fa").format("jYYYY/jMM/jDD")}</li>
                                                        ))}
                                                    </ul>
                                                ) : "بدون جواب"}
                                            </td>
                                            <td className={styles.actions}>
                                                <button onClick={() => openPopup(report)} className={styles.detailsBtn} data-tooltip="نمایش جزئیات"><FaInfoCircle /></button>
                                                <button onClick={() => printReport(report)} className={styles.printBtn} data-tooltip="چاپ گزارش"><FaPrint /></button>
                                                <button onClick={() => storeReportAssistance(report.id)} className={styles.assistanceBtn} data-tooltip="داوطلب شدن"><FaPlus /></button>
                                                <button onClick={() => deleteReportAssistance(report.id)} className={styles.deleteAssistanceBtn} data-tooltip="لغو داوطلبی"><FaMinus /></button>
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={() => deleteReport(report.id)} className={styles.deleteReportBtn} data-tooltip="حذف گزارش"><FaTrash /></button>
                                                        <button onClick={() => openEditStatus(report)} className={styles.detailsBtn} data-tooltip="تغییر وضعیت"><FaEdit /></button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </section>

            {selectedReport && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <button onClick={closePopup} className={styles.closeBtn}>×</button>
                        <h3>{selectedReport.title || "بدون عنوان"}</h3>
                        <p><strong>وضعیت:</strong> <span className={`${styles.statusBadge} ${styles[selectedReport.status]}`}>{selectedReport.status === "pending" ? "در انتظار" : selectedReport.status === "in_progress" ? "در حال انجام" : "حل‌شده"}</span></p>
                        <p><strong>توضیحات:</strong> {selectedReport.description || "بدون توضیحات"}</p>
                        <p><strong>دسته‌بندی:</strong> {getCategoryName(selectedReport)}</p>
                        <p><strong>منطقه:</strong> {getRegionName(selectedReport)}</p>
                        <p><strong>مکان:</strong> {selectedReport.location || "نامشخص"}</p>
                        <p><strong>موقعیت جغرافیایی:</strong> {selectedReport.lat}, {selectedReport.long}</p>
                        <p><strong>تاریخ ایجاد:</strong> {moment(selectedReport.created_at).locale("fa").format("jYYYY/jMM/jDD")}</p>
                        <div className={styles.images}>
                            <p><strong>جواب‌ها:</strong></p>
                            {selectedReport.replies && selectedReport.replies.length > 0 ? (
                                <ul>
                                    {selectedReport.replies.map((reply) => (
                                        <li key={reply.id}>ادمین: {reply.admin.name} {reply.admin.family} - توضیح: {reply.comment || "بدون توضیح"} - تاریخ: {moment(reply.done_at).locale("fa").format("jYYYY/jMM/jDD")}</li>
                                    ))}
                                </ul>
                            ) : <p>بدون جواب</p>}
                        </div>
                        <button onClick={() => printReport(selectedReport)} className={styles.printPopupBtn}><FaPrint /> چاپ گزارش</button>
                    </div>
                </div>
            )}

            {editStatus && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <button onClick={closeEditStatus} className={styles.closeBtn}>×</button>
                        <h3>تغییر وضعیت گزارش</h3>
                        <select
                            value={editStatus.status}
                            onChange={(e) => setEditStatus({ ...editStatus, status: e.target.value })}
                            className={styles.filterSelect}
                        >
                            <option value="pending">در انتظار</option>
                            <option value="in_progress">در حال انجام</option>
                            <option value="resolved">حل‌شده</option>
                        </select>
                        <textarea
                            value={editStatus.comment || ""}
                            onChange={(e) => setEditStatus({ ...editStatus, comment: e.target.value })}
                            placeholder="توضیحات"
                            className={styles.filterInput}
                            rows="3"
                        />
                        <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
                            <DatePicker
                                value={editStatus.done_at ? moment(editStatus.done_at, "YYYY-MM-DD") : null}
                                onChange={(newValue) => setEditStatus({ ...editStatus, done_at: newValue.format("YYYY-MM-DD") })}
                                renderInput={(params) => <input {...params} className={styles.filterInput} />}
                            />
                        </LocalizationProvider>
                        <button
                            onClick={() => updateStatus(editStatus.id, editStatus.status, editStatus.comment, editStatus.done_at)}
                            className={styles.runQueryBtn}
                            disabled={loading}
                        >
                            ثبت تغییرات
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GetReports;