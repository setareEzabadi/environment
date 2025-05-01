import { useState, useEffect } from 'react';
import styles from './DashboardKarbar.module.css';
import env from '../../env';

const GetReports = () => {
    const [reports, setReports] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [filters, setFilters] = useState({ status: 'pending', category_id: '', sort: 'latest' });
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch reports and categories on mount
    useEffect(() => {
        fetchReports();
        fetchCategories();
        const userRole = localStorage.getItem('userRole'); // Replace with actual auth logic
        setIsAdmin(userRole === 'admin');
    }, []);

    // Fetch all reports
    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${env.baseUrl}api/getReports`);
            const result = await response.json();
            if (result.status) {
                setReports(result.data);
            } else {
                setError('خطا در دریافت گزارش‌ها');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${env.baseUrl}api/getCategories`);
            const result = await response.json();
            if (result.status) {
                setCategories(result.data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    // Update report status (admin only)
    const updateStatus = async (reportId, newStatus) => {
        try {
            const response = await fetch(`${env.baseUrl}api/updateStatus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_id: reportId, status: newStatus }),
            });
            const result = await response.json();
            if (result.status) {
                setReports(reports.map(report =>
                    report.id === reportId ? { ...report, status: newStatus } : report
                ));
            } else {
                setError('خطا در به‌روزرسانی وضعیت');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        }
    };

    // Delete report (admin only)
    const deleteReport = async (reportId) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟')) return;
        try {
            const response = await fetch(`${env.baseUrl}api/deleteReport`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_id: reportId }),
            });
            const result = await response.json();
            if (result.status) {
                setReports(reports.filter(report => report.id !== reportId));
            } else {
                setError('خطا در حذف گزارش');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        }
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Fetch filtered reports
    const fetchFilteredReports = async () => {
        setLoading(true);
        try {
            const url = `${env.baseUrl}api/reports/filter?status=${filters.status}&category_id=${filters.category_id}&sort=${filters.sort}`;
            const response = await fetch(url);
            const result = await response.json();
            if (result.status) {
                setReports(result.data);
            } else {
                setError('خطا در فیلتر گزارش‌ها');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    // Handle image upload
    const handleImageUpload = async (reportId, file) => {
        const formData = new FormData();
        formData.append('report_id', reportId);
        formData.append('report_image', file);
        try {
            const response = await fetch(`${env.baseUrl}api/recordReportImage`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.status) {
                alert('تصویر با موفقیت آپلود شد');
            } else {
                setError('خطا در آپلود تصویر');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        }
    };

    // Add new category
    const addCategory = async () => {
        if (!newCategory) return;
        try {
            const response = await fetch(`${env.baseUrl}api/storeCategory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategory }),
            });
            const result = await response.json();
            if (result.status) {
                setCategories([...categories, { id: result.data.id, name: newCategory }]);
                setNewCategory('');
            } else {
                setError('خطا در افزودن دسته‌بندی');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        }
    };

    // Delete category
    const deleteCategory = async (categoryId) => {
        try {
            const response = await fetch(`${env.baseUrl}api/deleteCategory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category_id: categoryId }),
            });
            const result = await response.json();
            if (result.status) {
                setCategories(categories.filter(cat => cat.id !== categoryId));
            } else {
                setError('خطا در حذف دسته‌بندی');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        }
    };

    return (
        <div className={styles.getReports}>
            <h3>مدیریت گزارش‌ها</h3>
            {error && <span className={styles.error}>{error}</span>}

            {/* Filter Section */}
            <div className={styles.filterSection}>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">همه وضعیت‌ها</option>
                    <option value="pending">در انتظار</option>
                    <option value="reviewed">بررسی‌شده</option>
                    <option value="resolved">حل‌شده</option>
                </select>
                <select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                    <option value="">همه دسته‌بندی‌ها</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                    <option value="latest">جدیدترین</option>
                    <option value="oldest">قدیمی‌ترین</option>
                </select>
                <button onClick={fetchFilteredReports} className={styles.searchBtn}>
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
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <span>{cat.name}</span>
                                <button onClick={() => deleteCategory(cat.id)} className={styles.deleteBtn}>
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
                        reports.map(report => (
                            <div key={report.id} className={styles.reportCard}>
                                <div className={styles.reportHeader}>
                                    <h4>{report.title}</h4>
                                    {isAdmin && (
                                        <button
                                            onClick={() => deleteReport(report.id)}
                                            className={styles.deleteReportBtn}
                                        >
                                            حذف گزارش
                                        </button>
                                    )}
                                </div>
                                <p className={styles.description}>{report.description}</p>
                                <p>موقعیت: {report.lat}, {report.long}</p>
                                <p>وضعیت: {report.status === 'pending' ? 'در انتظار' : report.status === 'reviewed' ? 'بررسی‌شده' : 'حل‌شده'}</p>
                                <p>تاریخ: {new Date(report.created_at).toLocaleDateString('fa-IR')}</p>

                                {/* Status Update for Admins */}
                                {isAdmin && (
                                    <select
                                        value={report.status}
                                        onChange={(e) => updateStatus(report.id, e.target.value)}
                                        className={styles.statusSelect}
                                    >
                                        <option value="pending">در انتظار</option>
                                        <option value="reviewed">بررسی‌شده</option>
                                        <option value="resolved">حل‌شده</option>
                                    </select>
                                )}

                                {/* Image Upload */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(report.id, e.target.files[0])}
                                    className={styles.fileInput}
                                />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default GetReports;