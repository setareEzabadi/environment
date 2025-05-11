import { useState, useEffect } from 'react';
import styles from './Reports.module.css';
import env from '../../env';
import { toast } from 'react-toastify';
import { FaTrash } from 'react-icons/fa';

const ManageReports = ({ categories, regions, isAdmin, fetchCategories }) => {
    const [reports, setReports] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [filters, setFilters] = useState({ status: '', category_id: '', sort: 'latest' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, links: [] });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('توکن احراز هویت یافت نشد');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/getReports`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error(`خطای HTTP! وضعیت: ${response.status}`);
            const result = await response.json();
            console.log('پاسخ دریافت گزارش‌ها:', result);
            setReports(Array.isArray(result.data) ? result.data : []);
            setPagination({ current_page: 1, last_page: 1, links: [] });
        } catch (err) {
            setError(err.message || 'خطا در ارتباط با سرور');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredReports = async (page = 1) => {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setError('توکن احراز هویت یافت نشد');
            setLoading(false);
            return;
        }

        try {
            const url = new URL(`${env.baseUrl}api/reports/filter`);
            url.searchParams.append('page', page);
            if (filters.status) url.searchParams.append('status', filters.status);
            if (filters.category_id) url.searchParams.append('category_id', filters.category_id);
            url.searchParams.append('sort', filters.sort);

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error(`خطای HTTP! وضعیت: ${response.status}`);
            const result = await response.json();
            console.log('پاسخ فیلتر گزارش‌ها:', result);
            setReports(result.data || []);
            setPagination({
                current_page: result.current_page || 1,
                last_page: result.last_page || 1,
                links: result.links || [],
            });
        } catch (err) {
            setError(err.message || 'خطا در ارتباط با سرور');
            setReports([]);
            setPagination({ current_page: 1, last_page: 1, links: [] });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (reportId, newStatus) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('توکن احراز هویت یافت نشد');
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/updateStatus`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ report_id: reportId, status: newStatus }),
            });

            const result = await response.json();
            console.log('پاسخ تغییر وضعیت:', result);
            if (!response.ok) {
                throw new Error(result.message || 'خطا در به‌روزرسانی وضعیت');
            }

            setReports(reports.map((report) =>
                report.id === reportId ? { ...report, status: newStatus } : report
            ));
            toast.success('وضعیت گزارش به‌روزرسانی شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const addCategory = async () => {
        if (!newCategory) {
            toast.error('نام دسته‌بندی را وارد کنید');
            return;
        }
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('توکن احراز هویت یافت نشد');
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/storeCategory`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newCategory }),
            });

            const result = await response.json();
            console.log('پاسخ افزودن دسته‌بندی:', result);
            if (!response.ok) {
                throw new Error(result.message || 'خطا در افزودن دسته‌بندی');
            }

            setCategories([...categories, { id: result.category.id, name: newCategory }]);
            setNewCategory('');
            toast.success('دسته‌بندی با موفقیت اضافه شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const deleteCategory = async (categoryId) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('توکن احراز هویت یافت نشد');
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/deleteCategory`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category_id: categoryId }),
            });

            const result = await response.json();
            console.log('پاسخ حذف دسته‌بندی:', result);
            if (!response.ok) {
                throw new Error(result.message || 'خطا در حذف دسته‌بندی');
            }

            setCategories(categories.filter((cat) => cat.id !== categoryId));
            toast.success('دسته‌بندی با موفقیت حذف شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const deleteReport = async (reportId) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟')) return;
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('توکن احراز هویت یافت نشد');
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/destroyReport`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ report_id: reportId }),
            });

            const result = await response.json();
            console.log('پاسخ حذف گزارش:', result);
            if (!response.ok) {
                throw new Error(result.message || 'خطا در حذف گزارش');
            }

            setReports(reports.filter((report) => report.id !== reportId));
            toast.success('گزارش با موفقیت حذف شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const storeReportAssistance = async (reportId) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('توکن احراز هویت یافت نشد');
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/storeReportAssistance`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ report_id: reportId }),
            });

            const result = await response.json();
            console.log('پاسخ افزودن کمک:', result);
            if (!response.ok) {
                throw new Error(result.message || 'خطا در ثبت کمک');
            }

            toast.success('کمک به گزارش ثبت شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const deleteReportAssistance = async (reportId) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('توکن احراز هویت یافت نشد');
            return;
        }

        try {
            const response = await fetch(`${env.baseUrl}api/deleteReportAssistance`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ report_id: reportId }),
            });

            const result = await response.json();
            console.log('پاسخ حذف کمک:', result);
            if (!response.ok) {
                throw new Error(result.message || 'خطا در حذف کمک');
            }

            toast.success('کمک از گزارش حذف شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handlePageChange = (pageUrl) => {
        if (!pageUrl) return;
        const page = new URL(pageUrl).searchParams.get('page');
        fetchFilteredReports(page);
    };

    const getCategoryName = (report) => {
        if (report.category && report.category.name) return report.category.name;
        const category = categories.find((cat) => cat.id === report.category_id);
        return category ? category.name : 'بدون دسته‌بندی';
    };

    const getRegionName = (report) => {
        if (report.region && report.region.name) return report.region.name;
        const region = regions.find((reg) => reg.id === report.region_id);
        return region ? region.name : 'بدون منطقه';
    };

    return (
        <>
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

            {/* مدیریت دسته‌بندی‌ها (فقط ادمین) */}
            {isAdmin && (
                <section className={styles.categorySection}>
                    <h3>مدیریت دسته‌بندی‌ها</h3>
                    <div className={styles.categoryForm}>
                        <input
                            type="text"
                            placeholder="نام دسته‌بندی جدید"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button onClick={addCategory} className={styles.addCategoryBtn}>
                            افزودن
                        </button>
                    </div>
                    <ul className={styles.categoryList}>
                        {categories.map((cat) => (
                            <li key={cat.id}>
                                <span>{cat.name}</span>
                                <button onClick={() => deleteCategory(cat.id)} className={styles.deleteBtn}>
                                    <FaTrash />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* لیست گزارش‌ها */}
            <section className={styles.reportsSection}>
                <h3>لیست گزارش‌ها</h3>
                {error && <span className={styles.error}>{error}</span>}
                {loading ? (
                    <div className={styles.loader}>در حال بارگذاری...</div>
                ) : (
                    <div className={styles.reportsList}>
                        {reports.length === 0 ? (
                            <p className={styles.noReports}>گزارشی یافت نشد</p>
                        ) : (
                            reports.map((report) => (
                                <div
                                    key={report.id}
                                    className={`${styles.reportCard} ${styles[report.status]}`}
                                >
                                    <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                                        {report.status === 'pending'
                                            ? 'در انتظار'
                                            : report.status === 'in_progress'
                                                ? 'در حال انجام'
                                                : 'حل‌شده'}
                                    </span>
                                    <div className={styles.reportHeader}>
                                        <h4>{report.title || 'بدون عنوان'}</h4>
                                        {isAdmin && (
                                            <button
                                                onClick={() => deleteReport(report.id)}
                                                className={styles.deleteReportBtn}
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                    <p className={styles.description}>{report.description || 'بدون توضیحات'}</p>
                                    <p>دسته‌بندی: {getCategoryName(report)}</p>
                                    <p>مکان: {report.location || 'نامشخص'}</p>
                                    <p>موقعیت جغرافیایی: {report.lat}, {report.long}</p>
                                    <p>منطقه: {getRegionName(report)}</p>
                                    <p>
                                        تاریخ ایجاد: {new Date(report.created_at).toLocaleDateString('fa-IR')}
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

                {pagination.links.length > 0 && (
                    <div className={styles.pagination}>
                        {pagination.links.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageChange(link.url)}
                                disabled={!link.url}
                                className={link.active ? styles.activePage : ''}
                            >
                                {link.label === '« Previous' ? 'قبلی' : link.label === 'Next »' ? 'بعدی' : link.label}
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default ManageReports;
