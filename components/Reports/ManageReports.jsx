import { useState, useEffect } from 'react';
import styles from './Reports.module.css';
import env from '../../env';
import { toast } from 'react-toastify';
import { FaTrash, FaPrint, FaInfoCircle, FaPlus, FaMinus, FaSearch } from 'react-icons/fa';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMomentJalaali } from '@mui/x-date-pickers/AdapterMomentJalaali';
import TextField from '@mui/material/TextField';
import moment from 'moment-jalaali';

const ManageReports = ({ categories, regions, isAdmin }) => {
    const [reports, setReports] = useState([]);
    const [filters, setFilters] = useState({ status: '', category_id: '', sort: 'latest' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, links: [] });
    const [selectedReport, setSelectedReport] = useState(null);
    const [filterOptions, setFilterOptions] = useState([]);
    const [dynamicFilterValues, setDynamicFilterValues] = useState({});
    const [filterMessage, setFilterMessage] = useState('');
    // ======= کدهای مربوط به جستجوی tracking_code =======
    const [searchCode, setSearchCode] = useState('');
    const [trackedReport, setTrackedReport] = useState(null); // برای ذخیره گزارش پیدا شده
    const [trackError, setTrackError] = useState('');

    const handleTrackSearch = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        if (!searchCode.trim()) {
            setTrackError('لطفا کد پیگیری را وارد کنید.');
            setTrackedReport(null);
            return;
        }
        setTrackError('');
        setTrackedReport(null);

        try {
            const url = `${env.baseUrl}api/report/track?tracking_code=${encodeURIComponent(searchCode)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();

            if (!response.ok) {
                if (result.status === false) {
                    setTrackError(result.message || 'خطا در جستجوی پیگیری');
                    if (result.errors && result.message && Array.isArray(result.message)) {
                        setTrackError(result.message);
                    }
                } else {
                    setTrackError(`خطای HTTP! وضعیت: ${response.status}`);
                }
                return;
            }

            if (result.status === false) {
                setTrackError(result.message || 'کد پیگیری معتبر نیست.');
                if (result.message && result.message && Array.isArray(result.message)) {
                    setTrackError(result.message);
                }
                return;
            }

            if (result.status === true && result.data) {
                setTrackedReport(result.data); // ذخیره گزارش پیدا شده برای نمایش در پاپ‌آپ
                toast.success(result.message || 'گزارش با موفقیت پیدا شد.');
            } else {
                setTrackError(result.message || 'هیچ داده‌ای دریافت نشد.');
            }
        } catch (err) {
            console.error('خطا در جستجوی پیگیری:', err);
            setTrackError(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const closeTrackPopup = () => {
        setTrackedReport(null); // بستن پاپ‌آپ
    };
    // =========================================================

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchFilterOptions();
        }
    }, [isAdmin]);

    const fetchReports = async () => {
        setLoading(true);
        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch(`${env.baseUrl}api/getReports`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                ...(token && { Authorization: `Bearer ${token}` }),
            });
            if (!response.ok) throw new Error(`خطای HTTP! وضعیت: ${response.status}`);
            const result = await response.json();
            setReports(Array.isArray(result.data) ? result.data : []);
            setPagination({ current_page: 1, last_page: 1, links: [] });
        } catch (err) {
            setError(err.message || 'خطا در ارتباط با سرور');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        setLoading(true);
        const token = localStorage.getItem('auth_token');

        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`${env.baseUrl}api/ReportFilterOptions`, {
                method: 'GET',
                headers,
            });
            if (!response.ok) throw new Error(`خطای HTTP! وضعیت: ${response.status}`);
            const result = await response.json();
            const ops = Array.isArray(result.filters) ? result.filters : [];
            setFilterOptions(ops);
            const initialValues = {};
            ops.forEach((f) => {
                initialValues[f.key] = '';
            });
            setDynamicFilterValues(initialValues);
        } catch (err) {
            console.error('خطا در دریافت گزینه‌های فیلتر:', err);
            setError(err.message || 'خطا در دریافت گزینه‌های فیلتر');
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredReports = async (page = 1) => {
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
            const url = new URL(`${env.baseUrl}api/reports/filter`);
            url.searchParams.append('page', page);
            if (filters.status) url.searchParams.append('status', filters.status);
            if (filters.category_id) url.searchParams.append('category_id', filters.category_id);
            url.searchParams.append('sort', filters.sort);
            const headers = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const response = await fetch(url, {
                headers,
            });
            if (!response.ok) throw new Error(`خطای HTTP! وضعیت: ${response.status}`);
            const result = await response.json();
            setReports(result?.data?.data || []);
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
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
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
            if (!response.ok) {
                throw new Error(result.message || 'خطا در به‌روزرسانی وضعیت');
            }
            setReports((prev) =>
                prev.map((report) =>
                    report.id === reportId ? { ...report, status: newStatus } : report
                )
            );
            toast.success('وضعیت گزارش به‌روزرسانی شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const deleteReport = async (reportId) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟')) return;
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
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
            if (!response.ok) {
                throw new Error(result.message || 'خطا در حذف گزارش');
            }
            setReports((prev) => prev.filter((report) => report.id !== reportId));
            toast.success('گزارش با موفقیت حذف شد');
        } catch (err) {
            toast.error(err.message || 'خطا در ارتباط با سرور');
        }
    };

    const storeReportAssistance = async (reportId) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
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
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
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

    const handleDynamicFilterChange = (key, rawValue) => {
        setDynamicFilterValues((prev) => ({
            ...prev,
            [key]: rawValue,
        }));
    };

    const performDynamicSearch = async () => {
        setLoading(true);
        setFilterMessage('');
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید!');
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
            return;
        }

        try {
            const url = new URL(`${env.baseUrl}api/searchReports`);
            Object.entries(dynamicFilterValues).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    url.searchParams.append(key, value);
                }
            });
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            };
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers,
            });
            const result = await response.json();

            // مدیریت پاسخ بک‌اند
            if (result.status === false && Array.isArray(result.data) && result.data.length === 0) {
                setReports([]);
                setFilterMessage(result.message || 'گزارشی یافت نشد'); // پیام بک‌اند
                setPagination({ current_page: 1, last_page: 1, links: [] });
            } else if (!response.ok) {
                // فقط اگه پاسخ غیر 404 باشه یا JSON نامعتبر باشه ارور بندازیم
                throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
            } else {
                // پاسخ موفق با داده‌ها
                setReports(Array.isArray(result.data) ? result.data : []);
                setFilterMessage(''); // پاک کردن پیام در صورت موفقیت
                setPagination({
                    current_page: result.current_page || 1,
                    last_page: result.last_page || 1,
                    links: Array.isArray(result.links) ? result.links : [],
                });
            }
        } catch (err) {
            console.error('خطا در جستجوی داینامیک:', err);
            setError(err.message || 'خطا در ارتباط با سرور');
            toast.error(err.message || 'خطا در ارتباط با سرور');
            setReports([]);
            setFilterMessage(''); // ریست پیام در صورت خطا
            setPagination({ current_page: 1, last_page: 1, links: [] });
        } finally {
            setLoading(false);
        }
    };

    const printTable = () => {
        const printWindow = window.open('', '_blank');
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
                    .unprocessed { background:rgb(250, 209, 209); color:rgb(185, 16, 16); }
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
                                <td>${report.title || 'بدون عنوان'}</td>
                                <td><span class="statusBadge ${report.status}">
                                    ${report.status === 'pending'
                            ? 'در انتظار'
                            : report.status === 'in_progress'
                                ? 'در حال انجام'
                                : 'حل‌شده'
                        }
                                </span></td>
                                <td>${getCategoryName(report)}</td>
                                <td>${getRegionName(report)}</td>
                                <td>${report.location || 'نامشخص'}</td>
                                <td>${new Date(report.created_at).toLocaleDateString('fa-IR')}</td>
                            </tr>
                        `
                )
                .join('')}
                    </tbody>
                </table>
            </body>
        </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const printReport = (report) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <html dir="rtl">
            <head>
                <title>چاپ گزارش ${report.title || 'بدون عنوان'}</title>
                <style>
                    body { font-family: 'iranSans', sans-serif; direction: rtl; padding: 20px; background: #f8fafc; }
                    .report { max-width: 800px; margin: auto; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
                    h2 { text-align: center; color: #1e293b; margin-bottom: 20px; }
                    p { margin: 12px 0; font-size: 14px; color: #475569; }
                    .statusBadge { padding: 6px 12px; border-radius: 12px; font-size: 12px; }
                    .pending { background: #fef3c7; color: #d97706; }
                    .in_progress { background: #dbeafe; color: #2563eb; }
                    .resolved { background: #d1fae5; color: #10b981; }
                    .unprocessed { background:rgb(250, 209, 209); color:rgb(185, 16, 16); }
                    .images { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
                    img { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="report">
                    <h2>${report.title || 'بدون عنوان'}</h2>
                    <p><strong>وضعیت:</strong> <span class="statusBadge ${report.status}">
                        ${report.status === 'pending'
                ? 'در انتظار'
                : report.status === 'in_progress'
                    ? 'در حال انجام'
                    : 'حل‌شده'
            }
                    </span></p>
                    <p><strong>توضیحات:</strong> ${report.description || 'بدون توضیحات'}</p>
                    <p><strong>دسته‌بندی:</strong> ${getCategoryName(report)}</p>
                    <p><strong>منطقه:</strong> ${getRegionName(report)}</p>
                    <p><strong>مکان:</strong> ${report.location || 'نامشخص'}</p>
                    <p><strong>موقعیت جغرافیایی:</strong> ${report.lat}, ${report.long}</p>
                    <p><strong>تاریخ ایجاد:</strong> ${new Date(report.created_at).toLocaleDateString('fa-IR')}</p>
                    <div class="images">
                        <p><strong>تصاویر:</strong></p>
                        ${report.images && report.images.length > 0
                ? report.images
                    .map(
                        (image) => `
                                <img src="${env.baseUrl}${image.image_url}" alt="تصویر گزارش" />
                            `
                    )
                    .join('')
                : '<p>بدون تصویر</p>'
            }
                    </div>
                </div>
            </body>
        </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const openPopup = (report) => {
        setSelectedReport(report);
    };

    const closePopup = () => {
        setSelectedReport(null);
    };

    return (
        <>
            <section className={styles.trackSearchSection}>
                <h4>پیگیری گزارش</h4>
                <div className={styles.trackSearchControls}>
                    <input
                        type="text"
                        placeholder="کد پیگیری را وارد کنید"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        className={styles.trackInput}
                    />
                    <button onClick={handleTrackSearch} className={styles.trackSearchBtn}>
                        جستجوی پیگیری
                    </button>
                </div>
                {trackError && <p className={styles.trackError}>{trackError}</p>}
            </section>

            {isAdmin && (
                <section className={styles.filterSection}>
                    <h3>فیلتر نیمه پویا گزارش‌ها</h3>
                    {loading && filterOptions.length === 0 ? (
                        <div className={styles.loader}>
                            <span className={styles.loaderSpinner}></span> در حال بارگذاری گزینه‌های فیلتر...
                        </div>
                    ) : filterOptions.length === 0 ? (
                        <p className={styles.noFilters}>گزینه‌ای برای فیلتر یافت نشد.</p>
                    ) : (
                        <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
                            <div className={styles.filterContainer}>
                                <div className={styles.filterGrid}>
                                    {filterOptions.map((f) => {
                                        const { key, label, type, options } = f;
                                        const rawValue = dynamicFilterValues[key] ?? '';

                                        if (type === 'select') {
                                            return (
                                                <div key={key} className={styles.filterItem}>
                                                    <label htmlFor={key} className={styles.filterLabel}>
                                                        {label}
                                                    </label>
                                                    <select
                                                        id={key}
                                                        name={key}
                                                        value={rawValue}
                                                        onChange={(e) => handleDynamicFilterChange(key, e.target.value)}
                                                        className={styles.filterSelect}
                                                    >
                                                        <option value="">همه {label}</option>
                                                        {Array.isArray(options) &&
                                                            options.map((opt) => {
                                                                if (typeof opt === 'string') {
                                                                    return (
                                                                        <option key={opt} value={opt}>
                                                                            {opt === 'pending'
                                                                                ? 'در انتظار'
                                                                                : opt === 'in_progress'
                                                                                    ? 'در حال انجام'
                                                                                    : opt === 'resolved'
                                                                                        ? 'حل‌شده'
                                                                                        : opt === 'unprocessed'
                                                                                            ? 'پیگیری نشده'
                                                                                            : opt}
                                                                        </option>
                                                                    );
                                                                }
                                                                return (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </option>
                                                                );
                                                            })}
                                                    </select>
                                                </div>
                                            );
                                        }

                                        if (type === 'text') {
                                            return (
                                                <div key={key} className={styles.filterItem}>
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
                                                        className={styles.filterInput}
                                                    />
                                                </div>
                                            );
                                        }

                                        if (type === 'date') {
                                            const pickerValue = rawValue ? moment(rawValue, 'YYYY-MM-DD') : null;
                                            return (
                                                <div key={key} className={styles.filterItem}>
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
                                </div>
                                <div className={styles.filterActions}>
                                    <button onClick={performDynamicSearch} className={styles.searchBtn}>
                                        <FaSearch style={{ marginLeft: '8px' }} /> جستجو
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDynamicFilterValues({});
                                            toast.success('فیلترها با موفقیت بازنشانی شد');
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

            {!isAdmin && (
                <section className={styles.filterSection}>
                    <h3>فیلتر گزارش‌ها</h3>
                    <div className={styles.filterControls}>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">همه وضعیت‌ها</option>
                            <option value="pending">در انتظار</option>
                            <option value="in_progress">در حال انجام</option>
                            <option value="resolved">حل‌شده</option>
                            <option value="unprocessed">پیگیری نشده</option>
                        </select>
                        <select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                            <option value="">همه دسته‌بندی‌ها</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
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
            )}

            <section className={styles.reportsSection}>
                <div className={styles.tableHeader}>
                    <h3>لیست گزارش‌ها</h3>
                    {isAdmin && (
                        <button onClick={printTable} className={styles.printTableBtn}>
                            <FaPrint /> چاپ کل جدول
                        </button>
                    )}
                </div>
                {error && <span className={styles.error}>{error}</span>}
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
                                            <td>{report.title || 'بدون عنوان'}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[report.status]}`}>
                                                    {report.status === "pending"
                                                        ? "در انتظار"
                                                        : report.status === "unprocessed"
                                                            ? "پیگیری نشده"
                                                            : report.status === "in_progress"
                                                                ? "در حال انجام"
                                                                : "حل‌شده"}
                                                </span>
                                            </td>
                                            <td>{getCategoryName(report)}</td>
                                            <td>{getRegionName(report)}</td>
                                            <td>{report.location || 'نامشخص'}</td>
                                            <td>{new Date(report.created_at).toLocaleDateString('fa-IR')}</td>
                                            <td className={styles.actions}>
                                                <button
                                                    onClick={() => openPopup(report)}
                                                    className={styles.detailsBtn}
                                                    data-tooltip="نمایش جزئیات"
                                                >
                                                    <FaInfoCircle />
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => printReport(report)}
                                                        className={styles.printBtn}
                                                        data-tooltip="چاپ گزارش"
                                                    >
                                                        <FaPrint />
                                                    </button>
                                                )}
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
                                                            disabled={!localStorage.getItem('auth_token')}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                        {/* <select
                                                            value={report.status}
                                                            onChange={(e) => updateStatus(report.id, e.target.value)}
                                                            className={styles.statusSelect}
                                                            data-tooltip="تغییر وضعیت"
                                                            disabled={!localStorage.getItem('auth_token')}
                                                        >
                                                            <option value="pending">در انتظار</option>
                                                            <option value="in_progress">در حال انجام</option>
                                                            <option value="resolved">حل‌شده</option>
                                                        </select> */}
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
            </section>

            {/* پاپ‌آپ برای نمایش جزئیات گزارش پیدا شده با کد پیگیری */}
            {trackedReport && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <button onClick={closeTrackPopup} className={styles.closeBtn}>×</button>
                        <h3>{trackedReport.title || 'بدون عنوان'}</h3>
                        <p>
                            <strong>وضعیت:</strong>{' '}
                            <span className={`${styles.statusBadge} ${styles[trackedReport.status]}`}>
                                {trackedReport.status === 'pending'
                                    ? 'در انتظار'
                                    : trackedReport.status === 'in_progress'
                                        ? 'در حال انجام'
                                        : 'حل‌شده'}
                            </span>
                        </p>
                        <p>
                            <strong>توضیحات:</strong>{' '}
                            {trackedReport.description || 'بدون توضیحات'}
                        </p>
                        <p>
                            <strong>دسته‌بندی:</strong> {trackedReport.category?.name || 'بدون دسته‌بندی'}
                        </p>
                        <p>
                            <strong>منطقه:</strong> {trackedReport.region?.name || 'بدون منطقه'}
                        </p>
                        <p>
                            <strong>مکان:</strong> {trackedReport.location || 'نامشخص'}
                        </p>
                        <p>
                            <strong>موقعیت جغرافیایی:</strong>{' '}
                            {trackedReport.lat}, {trackedReport.long}
                        </p>
                        <p>
                            <strong>تاریخ ایجاد:</strong>{' '}
                            {new Date(trackedReport.created_at).toLocaleDateString('fa-IR')}
                        </p>
                        <p>
                            <strong>کاربر گزارش‌دهنده:</strong>{' '}
                            {trackedReport.user ? `${trackedReport.user.name} ${trackedReport.user.family}` : 'نامشخص'}
                        </p>
                        <div className={styles.images}>
                            <p><strong>تصاویر:</strong></p>
                            {trackedReport.images && trackedReport.images.length > 0 ? (
                                <div className={styles.imageGallery}>
                                    {trackedReport.images.map((image) => (
                                        <img
                                            key={image.id}
                                            src={`${env.baseUrl}${image.image_url}`}
                                            alt={`تصویر گزارش ${trackedReport.id}`}
                                            className={styles.reportImage}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p>بدون تصویر</p>
                            )}
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => printReport(trackedReport)}
                                className={styles.printPopupBtn}
                            >
                                <FaPrint /> چاپ گزارش
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* پاپ‌آپ برای نمایش جزئیات گزارش از جدول */}
            {selectedReport && (
                <div className={styles.popup}>
                    <div className={styles.popupContent}>
                        <button onClick={closePopup} className={styles.closeBtn}>×</button>
                        <h3>{selectedReport.title || 'بدون عنوان'}</h3>
                        <p>
                            <strong>وضعیت:</strong>{' '}
                            <span className={`${styles.statusBadge} ${styles[selectedReport.status]}`}>
                                {selectedReport.status === 'pending'
                                    ? 'در انتظار'
                                    : selectedReport.status === 'in_progress'
                                        ? 'در حال انجام'
                                        : 'حل‌شده'}
                            </span>
                        </p>
                        <p>
                            <strong>توضیحات:</strong>{' '}
                            {selectedReport.description || 'بدون توضیحات'}
                        </p>
                        <p>
                            <strong>دسته‌بندی:</strong> {getCategoryName(selectedReport)}
                        </p>
                        <p>
                            <strong>منطقه:</strong> {getRegionName(selectedReport)}
                        </p>
                        <p>
                            <strong>مکان:</strong> {selectedReport.location || 'نامشخص'}
                        </p>
                        <p>
                            <strong>موقعیت جغرافیایی:</strong>{' '}
                            {selectedReport.lat}, {selectedReport.long}
                        </p>
                        <p>
                            <strong>تاریخ ایجاد:</strong>{' '}
                            {new Date(selectedReport.created_at).toLocaleDateString('fa-IR')}
                        </p>
                        <div className={styles.images}>
                            <p><strong>تصاویر:</strong></p>
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
                        {isAdmin && (
                            <button
                                onClick={() => printReport(selectedReport)}
                                className={styles.printPopupBtn}
                            >
                                <FaPrint /> چاپ گزارش
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageReports;