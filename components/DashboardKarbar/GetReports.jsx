import { useState, useEffect } from "react";
import styles from "./DashboardKarbar.module.css";
import env from "../../env";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaPrint, FaInfoCircle, FaPlus, FaMinus, FaQuestionCircle } from "react-icons/fa";

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

    // تابع بررسی نقش کاربر
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
        } else {
            setIsAdmin(false);
            return false;
        }
    };

    // تابع برای لود اولیه داده‌ها
    const fetchInitialData = async () => {
        const isAdminUser = await checkUserRole();
        await fetchReports(isAdminUser);
        await fetchCategories();
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

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

        if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
        return result;
    };

    // تابع دریافت گزارش‌ها
    const fetchReports = async (isAdminUser) => {
        setLoading(true);
        try {
            const endpoint = isAdminUser ? `${env.baseUrl}api/getReports` : `${env.baseUrl}api/user/reports`;
            console.log("Requesting endpoint:", endpoint, "isAdminUser:", isAdminUser);
            const result = await sendRequest(endpoint);
            setReports(Array.isArray(result.data) ? result.data : []);
            setPagination({ current_page: 1, last_page: 1, links: [] });
            // toast.success("گزارش‌ها با موفقیت دریافت شدند");
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
            // toast.success("دسته‌بندی‌ها با موفقیت دریافت شدند");
        } catch (err) {
            setError(err.message || "خطا در دریافت دسته‌بندی‌ها");
            toast.error(err.message || "خطا در دریافت دسته‌بندی‌ها");
        }
    };

    const updateStatus = async (reportId, newStatus) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/updateStatus`, "POST", {
                report_id: reportId,
                status: newStatus,
            });
            setReports(reports.map((report) => (report.id === reportId ? { ...report, status: newStatus } : report)));
            toast.success("وضعیت گزارش با موفقیت به‌روزرسانی شد");
        } catch (err) {
            toast.error(err.message || "خطا در به‌روزرسانی وضعیت");
        }
    };

    const deleteReport = async (reportId) => {
        if (!window.confirm("آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟")) return;
        try {
            const result = await sendRequest(`${env.baseUrl}api/destroyReport`, "POST", {
                report_id: reportId,
            });
            setReports(reports.filter((report) => report.id !== reportId));
            toast.success("گزارش با موفقیت حذف شد");
        } catch (err) {
            toast.error(err.message || "خطا در حذف گزارش");
        }
    };

    const storeReportAssistance = async (reportId) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/storeReportAssistance`, "POST", {
                report_id: reportId,
            });
            toast.success("داوطلب شدن برای کمک ثبت شد");
        } catch (err) {
            toast.error(err.message || "خطا در ثبت داوطلبی");
        }
    };

    const deleteReportAssistance = async (reportId) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/deleteReportAssistance`, "POST", {
                report_id: reportId,
            });
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
            toast.success("گزارش‌های فیلترشده با موفقیت دریافت شدند");
        } catch (err) {
            setError(err.message || "خطا در فیلتر گزارش‌ها");
            setReports([]);
            setPagination({ current_page: 1, last_page: 1, links: [] });
            toast.error(err.message || "خطا در فیلتر گزارش‌ها");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (report) => {
        if (report.category && report.category.name) return report.category.name;
        const category = categories.find((cat) => cat.id === report.category_id);
        return category ? category.name : "بدون دسته‌بندی";
    };

    const getRegionName = (report) => {
        if (report.region && report.region.name) return report.region.name;
        return report.region_id || "بدون منطقه";
    };

    // پرینت کل جدول
    const printTable = () => {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>چاپ گزارش‌ها</title>
          <style>
            body { font-family: 'iranSans', sans-serif; direction: rtl; padding: 20px; background: #f8fafc; }
            h2 { text-align: center; color: #1e293b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; font-size: 14px; }
            th { background: #f1f5f9; color: #1e293b; font-weight: 600; }
            .statusBadge { padding: 6px 12px; border-radius: 12px; font-size: 12px; }
            .pending { background: #fef3c7; color: #d97706; }
            .in_progress { background: #dbeafe; color: #2563eb; }
            .resolved { background: #d1fae5; color: #10b981; }
          </style>
        </head>
        <body>
          <h2>لیست گزارش‌ها</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>عنوان</th>
                <th>وضعیت</th>
                <th>دسته‌بندی</th>
                <th>منطقه</th>
                <th>مکان</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              ${reports
                .map(
                    (report, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${report.title || "بدون عنوان"}</td>
                  <td><span class="statusBadge ${report.status}">
                    ${report.status === "pending" ? "در انتظار" : report.status === "in_progress" ? "در حال انجام" : "حل‌شده"}
                  </span></td>
                  <td>${getCategoryName(report)}</td>
                  <td>${getRegionName(report)}</td>
                  <td>${report.location || "نامشخص"}</td>
                  <td>${new Date(report.created_at).toLocaleDateString("fa-IR")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    // پرینت گزارش خاص
    const printReport = (report) => {
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>چاپ گزارش ${report.title || "بدون عنوان"}</title>
          <style>
            body { font-family: 'iranSans', sans-serif; direction: rtl; padding: 20px; background: #f8fafc; }
            .report { max-width: 800px; margin: auto; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
            h2 { text-align: center; color: #1e293b; margin-bottom: 20px; }
            p { margin: 12px 0; font-size: 14px; color: #475569; }
            .statusBadge { padding: 6px 12px; border-radius: 12px; font-size: 12px; }
            .pending { background: #fef3c7; color: #d97706; }
            .in_progress { background: #dbeafe; color: #2563eb; }
            .resolved { background: #d1fae5; color: #10b981; }
            .images { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
            img { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="report">
            <h2>${report.title || "بدون عنوان"}</h2>
            <p><strong>وضعیت:</strong> <span class="statusBadge ${report.status}">
              ${report.status === "pending" ? "در انتظار" : report.status === "in_progress" ? "در حال انجام" : "حل‌شده"}
            </span></p>
            <p><strong>توضیحات:</strong> ${report.description || "بدون توضیحات"}</p>
            <p><strong>دسته‌بندی:</strong> ${getCategoryName(report)}</p>
            <p><strong>منطقه:</strong> ${getRegionName(report)}</p>
            <p><strong>مکان:</strong> ${report.location || "نامشخص"}</p>
            <p><strong>موقعیت جغرافیایی:</strong> ${report.lat}, ${report.long}</p>
            <p><strong>تاریخ ایجاد:</strong> ${new Date(report.created_at).toLocaleDateString("fa-IR")}</p>
            <div class="images">
              <p><strong>تصاویر:</strong></p>
              ${report.images && report.images.length > 0
                ? report.images
                    .map(
                        (image) => `
                  <img src="${env.baseUrl}${image.image_url}" alt="تصویر گزارش" />
                `
                    )
                    .join("")
                : "<p>بدون تصویر</p>"}
            </div>
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    // باز کردن پاپ‌آپ
    const openPopup = (report) => {
        setSelectedReport(report);
    };

    // بستن پاپ‌آپ
    const closePopup = () => {
        setSelectedReport(null);
    };

    return (
        <div className={styles.getReports}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />
            <div className={styles.header}>
                <h3>لیست گزارش‌ها</h3>
                <button onClick={() => setShowHelp(!showHelp)} className={styles.helpButton} title="راهنما">
                    <FaQuestionCircle />
                </button>
            </div>
            {showHelp && (
                <div className={styles.helpSection}>
                    <h4>راهنمای استفاده</h4>
                    <p>در این صفحه می‌توانید گزارش‌های ثبت‌شده را مشاهده و مدیریت کنید.</p>
                    <ul>
                        <li>
                            <strong>فیلتر گزارش‌ها:</strong> از فیلترهای بالا برای جستجوی گزارش‌ها بر اساس وضعیت، دسته‌بندی، یا ترتیب استفاده کنید.
                        </li>
                        <li>
                            <strong>داوطلب شدن:</strong> با کلیک روی آیکون «+» می‌توانید برای کمک به حل مشکل داوطلب شوید.
                        </li>
                        <li>
                            <strong>لغو داوطلبی:</strong> با کلیک روی آیکون «−» می‌توانید داوطلبی خود را لغو کنید.
                        </li>
                        {isAdmin && (
                            <>
                                <li>
                                    <strong>تغییر وضعیت:</strong> وضعیت گزارش‌ها را به «در انتظار»، «در حال انجام»، یا «حل‌شده» تغییر دهید.
                                </li>
                                <li>
                                    <strong>حذف گزارش:</strong> گزارش‌های غیرضروری را حذف کنید.
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )}
            {error && <span className={styles.error}>{error}</span>}

            {/* فیلتر گزارش‌ها */}
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
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                        <option value="latest">جدیدترین</option>
                        <option value="oldest">قدیمی‌ترین</option>
                    </select>
                    <button onClick={() => fetchFilteredReports(1)} className={styles.searchBtn}>
                        جستجو
                    </button>
                </div>
            </section>

            {/* لیست گزارش‌ها */}
            <section className={styles.reportsSection}>
                <div className={styles.tableHeader}>
                    <h3>لیست گزارش‌ها</h3>
                    <button onClick={printTable} className={styles.printTableBtn}>
                        <FaPrint /> چاپ کل جدول
                    </button>
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
                                        <th>عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report, index) => (
                                        <tr key={report.id}>
                                            <td>{index + 1}</td>
                                            <td>{report.title || "بدون عنوان"}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                                                    {report.status === "pending"
                                                        ? "در انتظار"
                                                        : report.status === "in_progress"
                                                            ? "در حال انجام"
                                                            : "حل‌شده"}
                                                </span>
                                            </td>
                                            <td>{getCategoryName(report)}</td>
                                            <td>{getRegionName(report)}</td>
                                            <td>{report.location || "نامشخص"}</td>
                                            <td>{new Date(report.created_at).toLocaleDateString("fa-IR")}</td>
                                            <td className={styles.actions}>
                                                <button
                                                    onClick={() => openPopup(report)}
                                                    className={styles.detailsBtn}
                                                    data-tooltip="نمایش جزئیات"
                                                >
                                                    <FaInfoCircle />
                                                </button>
                                                <button
                                                    onClick={() => printReport(report)}
                                                    className={styles.printBtn}
                                                    data-tooltip="چاپ گزارش"
                                                >
                                                    <FaPrint />
                                                </button>
                                                <button
                                                    onClick={() => storeReportAssistance(report.id)}
                                                    className={styles.assistanceBtn}
                                                    data-tooltip="داوطلب شدن برای کمک"
                                                >
                                                    <FaPlus />
                                                </button>
                                                <button
                                                    onClick={() => deleteReportAssistance(report.id)}
                                                    className={styles.deleteAssistanceBtn}
                                                    data-tooltip="لغو داوطلبی برای کمک"
                                                >
                                                    <FaMinus />
                                                </button>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => deleteReport(report.id)}
                                                            className={styles.deleteReportBtn}
                                                            data-tooltip="حذف گزارش"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                        <select
                                                            value={report.status}
                                                            onChange={(e) => updateStatus(report.id, e.target.value)}
                                                            className={styles.statusSelect}
                                                            data-tooltip="تغییر وضعیت"
                                                        >
                                                            <option value="pending">در انتظار</option>
                                                            <option value="in_progress">در حال انجام</option>
                                                            <option value="resolved">حل‌شده</option>
                                                        </select>
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

                {pagination.links.length > 0 && (
                    <div className={styles.pagination}>
                        {pagination.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageChange(link.url)}
                                disabled={!link.url}
                                className={link.active ? styles.activePage : ""}
                            >
                                {link.label === "« Previous" ? "قبلی" : link.label === "Next »" ? "بعدی" : link.label}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* پاپ‌آپ جزئیات */}
            {selectedReport && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <button onClick={closePopup} className={styles.closeBtn}>×</button>
                        <h3>{selectedReport.title || "بدون عنوان"}</h3>
                        <p>
                            <strong>وضعیت:</strong>{" "}
                            <span className={`${styles.statusBadge} ${styles[selectedReport.status]}`}>
                                {selectedReport.status === "pending"
                                    ? "در انتظار"
                                    : selectedReport.status === "in_progress"
                                        ? "در حال انجام"
                                        : "حل‌شده"}
                            </span>
                        </p>
                        <p>
                            <strong>توضیحات:</strong> {selectedReport.description || "بدون توضیحات"}
                        </p>
                        <p>
                            <strong>دسته‌بندی:</strong> {getCategoryName(selectedReport)}
                        </p>
                        <p>
                            <strong>منطقه:</strong> {getRegionName(selectedReport)}
                        </p>
                        <p>
                            <strong>مکان:</strong> {selectedReport.location || "نامشخص"}
                        </p>
                        <p>
                            <strong>موقعیت جغرافیایی:</strong> {selectedReport.lat}, {selectedReport.long}
                        </p>
                        <p>
                            <strong>تاریخ ایجاد:</strong> {new Date(selectedReport.created_at).toLocaleDateString("fa-IR")}
                        </p>
                        <div className={styles.images}>
                            <p>
                                <strong>تصاویر:</strong>
                            </p>
                            {selectedReport.images && selectedReport.images.length > 0 ? (
                                <div className={styles.imageGallery}>
                                    {selectedReport.images.map((image) => (
                                        <img
                                            key={image.id}
                                            src={`${env.baseUrl}${image.image_url}`}
                                            alt={`تصویر گزارش ${selectedReport.id}`}
                                            className={styles.reportImage}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p>بدون تصویر</p>
                            )}
                        </div>
                        <button onClick={() => printReport(selectedReport)} className={styles.printPopupBtn}>
                            <FaPrint /> چاپ گزارش
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GetReports;