import { useState, useEffect } from 'react';
import styles from './DashboardKarbar.module.css';
import dynamic from 'next/dynamic';
import env from '../../env';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

const Reports = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        location: '',
        region_id: '',
        lat: '',
        long: '',
        image: null,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${env.baseUrl}api/getCategories`);
                const data = await response.json();
                setCategories(Array.isArray(data.data) ? data.data : []);
            } catch (error) {
                console.error('خطا در دریافت دسته‌بندی‌ها:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));

        // در لحظه خطا رو پاک کن
        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }));
    };

    const handleMapClick = (lat, long) => {
        setFormData((prev) => ({
            ...prev,
            lat,
            long,
        }));

        setErrors((prev) => ({
            ...prev,
            lat: '',
            long: '',
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'عنوان را وارد کنید.';
        if (!formData.description.trim()) newErrors.description = 'توضیحات را وارد کنید.';
        if (!formData.category_id) newErrors.category_id = 'دسته‌بندی را انتخاب کنید.';
        if (!formData.region_id.trim()) newErrors.region_id = 'منطقه را وارد کنید.';
        if (!formData.location.trim()) newErrors.location = 'مکان را وارد کنید.';
        if (!formData.lat || !formData.long) newErrors.map = 'موقعیت مکانی را روی نقشه انتخاب کنید.';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('لطفا خطاهای فرم را برطرف کنید.');
            return;
        }

        setIsSubmitting(true);

        const body = new FormData();
        for (let key in formData) {
            if (formData[key]) {
                body.append(key, formData[key]);
            }
        }

        try {
            const response = await fetch(`${env.baseUrl}api/recordReport`, {
                method: 'POST',
                body,
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('گزارش با موفقیت ثبت شد!');
                setFormData({
                    title: '',
                    description: '',
                    category_id: '',
                    location: '',
                    region_id: '',
                    lat: '',
                    long: '',
                    image: null,
                });
            } else {
                toast.error(result.message || 'خطایی در ثبت گزارش رخ داد');
            }
        } catch (error) {
            console.error('خطا:', error);
            toast.error('مشکلی در ارسال گزارش پیش آمد');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`${styles.Reports} ${styles.section}`}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />
            <h3>ثبت گزارش جدید</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
                <label>
                    عنوان:
                    <input type="text" name="title" value={formData.title} onChange={handleChange} />
                    {errors.title && <span className={styles.error}>{errors.title}</span>}
                </label>

                <label>
                    توضیحات:
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
                    {errors.description && <span className={styles.error}>{errors.description}</span>}
                </label>

                <label>
                    دسته‌بندی:
                    <select name="category_id" value={formData.category_id} onChange={handleChange}>
                        <option value="">انتخاب کنید</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    {errors.category_id && <span className={styles.error}>{errors.category_id}</span>}
                </label>

                <label>
                    منطقه:
                    <input type="text" name="region_id" value={formData.region_id} onChange={handleChange} />
                    {errors.region_id && <span className={styles.error}>{errors.region_id}</span>}
                </label>

                <label>
                    مکان:
                    <input type="text" name="location" value={formData.location} onChange={handleChange} />
                    {errors.location && <span className={styles.error}>{errors.location}</span>}
                </label>

                <label>
                    انتخاب موقعیت روی نقشه:
                    <MapPicker onMapClick={handleMapClick} />
                    {formData.lat && formData.long && (
                        <p className={styles.selectedLocation}>
                            موقعیت انتخاب شده: ({formData.lat.toFixed(5)}, {formData.long.toFixed(5)})
                        </p>
                    )}
                    {errors.map && <span className={styles.error}>{errors.map}</span>}
                </label>

                <label>
                    آپلود تصویر:
                    <input type="file" name="image" accept="image/*" onChange={handleChange} />
                </label>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'در حال ارسال...' : 'ارسال گزارش'}
                </button>
            </form>
        </div>
    );
};

export default Reports;
