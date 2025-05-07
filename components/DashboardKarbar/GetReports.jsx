import { useState, useEffect } from 'react';
import styles from './DashboardKarbar.module.css';
import env from '../../env';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaQuestionCircle, FaTrash } from 'react-icons/fa';

const GetReports = () => {
    const [reports, setReports] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [filters, setFilters] = useState({ status: 'pending', category_id: '', sort: 'latest' });
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, links: [] });
    const [showHelp, setShowHelp] = useState(false);

    // تابع بررسی نقش کاربر
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
                setError('خطا در بارگذاری اطلاعات کاربر');
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

    useEffect(() => {
        fetchReports();
        fetchCategories();
        checkUserRole();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const result = await sendRequest(`${env.baseUrl}api/user/reports`);
            setReports(Array.isArray(result.data) ? result.data : []);
            setPagination({ current_page: 1, last_page: 1, links: [] });
            toast.success('گزارش‌ها با موفقیت دریافت شدند');
        } catch (err) {
            setError(err.message || 'خطا در دریافت گزارش‌ها');
            setReports([]);
            toast.error(err.message || 'خطا در دریافت گزارش‌ها');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCategories`);
            setCategories(Array.isArray(result.data) ? result.data : []);
            toast.success('دسته‌بندی‌ها با موفقیت دریافت شدند');
        } catch (err) {
            setError(err.message || 'خطا در دریافت دسته‌بندی‌ها');
            toast.error(err.message || 'خطا در دریافت دسته‌بندی‌ها');
        }
    };

    const updateStatus = async (reportId, newStatus) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/updateStatus`, 'POST', {
                report_id: reportId,
                status: newStatus,
            });
            setReports(reports.map((report) =>
                report.id === reportId ? { ...report, status: newStatus } : report
            ));
            toast.success('وضعیت گزارش با موفقیت به‌روزرسانی شد');
        } catch (err) {
            toast.error(err.message || 'خطا در به‌روزرسانی وضعیت');
        }
    };

    const deleteReport = async (reportId) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟')) return;
        try {
            const result = await sendRequest(`${env.baseUrl}api/deleteReport`, 'POST', {
                report_id: reportId,
            });
            setReports(reports.filter((report) => report.id !== reportId));
            toast.success('گزارش با موفقیت حذف شد');
        } catch (err) {
            toast.error(err.message || 'خطا در حذف گزارش');
        }
    };

    const storeReportAssistance = async (reportId) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/storeReportAssistance`, 'POST', {
                report_id: reportId,
            });
            toast.success('کمک به گزارش ثبت شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ثبت کمک');
        }
    };

    const deleteReportAssistance = async (reportId) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/deleteReportAssistance`, 'POST', {
                report_id: reportId,
            });
            toast.success('کمک از گزارش حذف شد');
        } catch (err) {
            toast.error(err.message || 'خطا در حذف کمک');
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
            url.searchParams.append('page', page);
            if (filters.status) url.searchParams.append('status', filters.status);
            if (filters.category_id) url.searchParams.append('category_id', filters.category_id);
            url.searchParams.append('sort', filters.sort);

            const result = await sendRequest(url.toString());
            setReports(Array.isArray(result.data) ? result.data : []);
            setPagination({
                current_page: result.current_page || 1,
                last_page: result.last_page || 1,
                links: result.links || [],
            });
            toast.success('گزارش‌های فیلترشده با موفقیت دریافت شدند');
        } catch (err) {
            setError(err.message || 'خطا در فیلتر گزارش‌ها');
            setReports([]);
            setPagination({ current_page: 1, last_page: 1, links: [] });
            toast.error(err.message || 'خطا در فیلتر گزارش‌ها');
        } finally {
            setLoading(false);
        }
    };

    const addCategory = async () => {
        if (!newCategory) {
            toast.error('نام دسته‌بندی را وارد کنید');
            return;
        }
        try {
            const result = await sendRequest(`${env.baseUrl}api/storeCategory`, 'POST', {
                name: newCategory,
            });
            setCategories([...categories, { id: result.category.id, name: newCategory }]);
            setNewCategory('');
            toast.success('دسته‌بندی با موفقیت اضافه شد');
        } catch (err) {
            toast.error(err.message || 'خطا در افزودن دسته‌بندی');
        }
    };

    const deleteCategory = async (categoryId) => {
        try {
            const result = await sendRequest(`${env.baseUrl}api/deleteCategory`, 'POST', {
                category_id: categoryId,
            });
            setCategories(categories.filter((cat) => cat.id !== categoryId));
            toast.success('دسته‌بندی با موفقیت حذف شد');
        } catch (err) {
            toast.error(err.message || 'خطا در حذف دسته‌بندی');
        }
    };

    const handlePageChange = (pageUrl) => {
        if (!pageUrl) return;
        const page = new URL(pageUrl).searchParams.get('page');
        fetchFilteredReports(page);
    };

    return (
        <div className={styles.getReports}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />
            <div className={styles.header}>
                <h3>مدیریت گزارش‌ها</h3>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className={styles.helpButton}
                    title="راهنما"
                >
                    <FaQuestionCircle />
                </button>
            </div>
            {showHelp && (
                <div className={styles.helpSection}>
                    <h4>راهنمای استفاده</h4>
                    <p>
                        در این صفحه می‌توانید گزارش‌های ثبت‌شده را مشاهده و مدیریت کنید. اگر
                        ادمین هستید، می‌توانید:
                    </p>
                    <ul>
                        <li>
                            <strong>فیلتر گزارش‌ها:</strong> از فیلترهای بالا برای جستجوی گزارش‌ها
                            بر اساس وضعیت، دسته‌بندی، یا ترتیب استفاده کنید.
                        </li>
                        <li>
                            <strong>مدیریت دسته‌بندی‌ها:</strong> دسته‌بندی‌های جدید اضافه کنید یا
                            دسته‌بندی‌های موجود را حذف کنید.
                        </li>
                        <li>
                            <strong>تغییر وضعیت:</strong> وضعیت گزارش‌ها را به «در انتظار»، «در حال
                            انجام»، یا «حل‌شده» تغییر دهید.
                        </li>
                        <li>
                            <strong>حذف گزارش:</strong> گزارش‌های غیرضروری را حذف کنید.
                        </li>
                    </ul>
                    <p>
                        اگر کاربر عادی هستید، فقط می‌توانید گزارش‌های خود را مشاهده کنید و امکان
                        ویرایش یا حذف آن‌ها را ندارید.
                    </p>
                </div>
            )}
            {error && <span className={styles.error}>{error}</span>}

            {/* Filter Section */}
            <div className={styles.filterSection}>
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

            {/* Category Management for Admins */}
            {isAdmin && (
                <div className={styles.categorySection}>
                    <h4>مدیریت دسته‌بندی‌ها</h4>
                    <div className={styles.categoryForm}>
                        <input
                            type="text"
                            placeholder="نام دسته‌بندی جدید"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button onClick={addCategory}>افزودن دسته‌بندی</button>
                    </div>
                    <ul className={styles.categoryList}>
                        {categories.map((cat) => (
                            <li key={cat.id}>
                                <span>{cat.name}</span>
                                <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className={styles.deleteBtn}
                                >
                                    حذف
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Reports List */}
            {loading ? (
                <div className={styles.loader}>در حال بارگذاری...</div>
            ) : (
                <div className={styles.reportsList}>
                    {reports.length === 0 ? (
                        <p className={styles.noReports}>گزارشی یافت نشد</p>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className={styles.reportCard}>
                                <div className={styles.reportHeader}>
                                    <h4>{report.title || 'بدون عنوان'}</h4>
                                    {isAdmin && (
                                        <button
                                            onClick={() => deleteReport(report.id)}
                                            className={styles.deleteReportBtn}
                                        >
                                            حذف گزارش
                                        </button>
                                    )}
                                </div>
                                <p className={styles.description}>
                                    {report.description || 'بدون توضیحات'}
                                </p>
                                <p>دسته‌بندی: {report.category?.name || 'نامشخص'}</p>
                                <p>مکان: {report.location || 'نامشخص'}</p>
                                <p>موقعیت جغرافیایی: {report.lat}, {report.long}</p>
                                <p>منطقه: {report.region?.name || report.region_id || 'نامشخص'}</p>
                                <p>
                                    وضعیت:{' '}
                                    {report.status === 'pending'
                                        ? 'در انتظار'
                                        : report.status === 'in_progress'
                                            ? 'در حال انجام'
                                            : 'حل‌شده'}
                                </p>
                                <p>
                                    تاریخ ایجاد:{' '}
                                    {new Date(report.created_at).toLocaleDateString('fa-IR')}
                                </p>
                                <div className={styles.images}>
                                    <p>تصاویر:</p>
                                    {report.images && report.images.length > 0 ? (
                                        <div className={styles.imageGallery}>
                                            {report.images.map((image) => (
                                                <img
                                                    key={image.id}
                                                    src={`${env.baseUrl}${image.image_url}`}
                                                    alt={`تصویر گزارش ${report.id}`}
                                                    className={styles.reportImage}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p>بدون تصویر</p>
                                    )}
                                </div>

                                {isAdmin && (
                                    <div className={styles.adminActions}>
                                        <select
                                            value={report.status}
                                            onChange={(e) => updateStatus(report.id, e.target.value)}
                                            className={styles.statusSelect}
                                        >
                                            <option value="pending">در انتظار</option>
                                            <option value="in_progress">در حال انجام</option>
                                            <option value="resolved">حل‌شده</option>
                                        </select>
                                        <button
                                            onClick={() => storeReportAssistance(report.id)}
                                            className={styles.assistanceBtn}
                                        >
                                            افزودن کمک
                                        </button>
                                        <button
                                            onClick={() => deleteReportAssistance(report.id)}
                                            className={styles.deleteAssistanceBtn}
                                        >
                                            حذف کمک
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pagination */}
            {reports.length > 0 && pagination.links.length > 0 && (
                <div className={styles.pagination}>
                    {pagination.links.map((link, index) => (
                        <button
                            key={index}
                            onClick={() => handlePageChange(link.url)}
                            disabled={!link.url}
                            className={link.active ? styles.activePage : ''}
                        >
                            {link.label === '« Previous'
                                ? 'قبلی'
                                : link.label === 'Next »'
                                    ? 'بعدی'
                                    : link.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GetReports;