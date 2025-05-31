import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import styles from './Reports.module.css';
import env from '../../env';
import { toast } from 'react-toastify';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

const NewReportForm = ({ categories, regions, fetchReports }) => {
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
    const [images, setImages] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mapCenter, setMapCenter] = useState([36.8392, 54.4342]);
    const [trackingCode, setTrackingCode] = useState(null);
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const isInGolestan = (lat, lon) => {
        const latMin = 36.5;
        const latMax = 37.8;
        const lonMin = 53.8;
        const lonMax = 56.2;
        return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
    };

    const geocodeAddress = useCallback(
        debounce(async (address) => {
            if (!address.trim()) return;
            try {
                const apiKey = '253caed1f6994bf8b01f3ab1061bd7e6';
                const response = await fetch(
                    `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
                        address
                    )}&format=json&apiKey=${apiKey}&filter=rect:53.8,36.5,56.2,37.8`
                );
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const { lat, lon } = data.results[0];
                    if (isInGolestan(lat, lon)) {
                        setMapCenter([parseFloat(lat), parseFloat(lon)]);
                        setFormData((prev) => ({
                            ...prev,
                            lat: lat.toString(),
                            long: lon.toString(),
                        }));
                        setErrors((prev) => ({ ...prev, lat: '', long: '', map: '' }));
                    } else {
                        toast.error(
                            'آدرس خارج از استان گلستان است. لطفا آدرسی در گلستان وارد کنید.'
                        );
                    }
                } else {
                    toast.error(
                        'آدرس یافت نشد. لطفا آدرس دقیق‌تری در گلستان (مثل "کردکوی، گلستان") وارد کنید.'
                    );
                }
            } catch (error) {
                console.error('خطا در ژئوکدن:', error);
                toast.error('خطا در یافتن مختصات آدرس.');
            }
        }, 500),
        []
    );

    const uploadImage = async (file, token, index) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error(
                `تصویر ${index + 1} بیش از حد بزرگ است. حداکثر اندازه مجاز: ${MAX_FILE_SIZE / (1024 * 1024)
                } مگابایت.`
            );
            return;
        }

        const body = new FormData();
        body.append('image', file);

        try {
            const response = await fetch(`${env.baseUrl}api/uploadTemporaryImage`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `HTTP error! status: ${response.status}, message: ${errorData.message || 'نامشخص'
                    }`
                );
            }

            const result = await response.json();
            if (result.status && result.image_url) {
                setImages((prev) => [...prev, result.image_url]);
                toast.success(`تصویر ${index + 1} با موفقیت آپلود شد.`);
            } else {
                throw new Error('پاسخ سرور نامعتبر است.');
            }
        } catch (error) {
            console.error('خطا در آپلود تصویر:', error);
            toast.error(
                `خطا در آپلود تصویر ${index + 1}: ${error.message || 'مشکل در ارتباط با سرور'
                }`
            );
        }
    };

    const handleChange = async (e) => {
        const { name, value, files } = e.target;

        setFormData((prev) => {
            const newData = { ...prev, [name]: files ? files[0] : value };
            return newData;
        });
        setErrors((prev) => ({ ...prev, [name]: '' }));

        if (name === 'location') {
            geocodeAddress(value);
        } else if (name === 'image' && files.length > 0) {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                toast.error('لطفا ابتدا وارد شوید.');
                return;
            }
            for (let i = 0; i < files.length; i++) {
                await uploadImage(files[i], token, i);
            }
        }
    };

    const handleMapClick = (lat, long) => {
        if (isInGolestan(lat, long)) {
            setFormData((prev) => ({
                ...prev,
                lat: lat.toString(),
                long: long.toString(),
            }));
            setErrors((prev) => ({ ...prev, lat: '', long: '', map: '' }));
        } else {
            toast.error(
                'موقعیت انتخاب‌شده خارج از گلستان است. لطفا در محدوده گلستان انتخاب کنید.'
            );
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'عنوان را وارد کنید.';
        if (!formData.description.trim())
            newErrors.description = 'توضیحات را وارد کنید.';
        if (!formData.category_id)
            newErrors.category_id = 'دسته‌بندی را انتخاب کنید.';
        if (!formData.location.trim())
            newErrors.location = 'مکان را وارد کنید.';
        if (!formData.region_id) newErrors.region_id = 'منطقه را انتخاب کنید.';
        if (!formData.lat || !formData.long)
            newErrors.map = 'موقعیت مکانی را روی نقشه انتخاب کنید.';
        if (images.length === 0) newErrors.image = 'حداقل یک تصویر آپلود کنید.';
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
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('لطفا ابتدا وارد شوید.');
            setIsSubmitting(false);
            return;
        }

        const body = {
            title: formData.title,
            description: formData.description,
            lat: formData.lat,
            long: formData.long,
            category_id: parseInt(formData.category_id),
            location: formData.location,
            region_id: parseInt(formData.region_id),
            images,
        };

        try {
            const response = await fetch(`${env.baseUrl}api/recordReport`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `HTTP error! status: ${response.status}, message: ${errorData.message || 'نامشخص'
                    }`
                );
            }

            const result = await response.json();
            if (result.status && result.tracking_code) {
                setTrackingCode(result.tracking_code);
                toast.success(
                    `گزارش با موفقیت ثبت شد! کد پیگیری: ${result.tracking_code}`
                );
            } else {
                toast.success('گزارش با موفقیت ثبت شد!');
            }

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
            setImages([]);
            setMapCenter([36.8392, 54.4342]);
            fetchReports();
        } catch (error) {
            console.error('خطا در ثبت گزارش:', error);
            toast.error(error.message || 'مشکلی در ارسال گزارش پیش آمد');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className={styles.formSection}>
            <h3>ثبت گزارش جدید</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
                <label>
                    <span className={styles.labelContainer}>
                        عنوان <span className={styles.required}>*</span>
                    </span>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                    />
                    {errors.title && (
                        <span className={styles.error}>{errors.title}</span>
                    )}
                </label>

                <label>
                    <span className={styles.labelContainer}>
                        توضیحات <span className={styles.required}>*</span>
                    </span>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                    />
                    {errors.description && (
                        <span className={styles.error}>{errors.description}</span>
                    )}
                </label>

                <label>
                    <span className={styles.labelContainer}>
                        دسته‌بندی <span className={styles.required}>*</span>
                    </span>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                    >
                        <option value="">انتخاب کنید</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    {errors.category_id && (
                        <span className={styles.error}>{errors.category_id}</span>
                    )}
                </label>

                <label>
                    <span className={styles.labelContainer}>
                        منطقه <span className={styles.required}>*</span>
                    </span>
                    <select
                        name="region_id"
                        value={formData.region_id}
                        onChange={handleChange}
                    >
                        <option value="">انتخاب کنید</option>
                        {regions.map((region) => (
                            <option key={region.id} value={region.id}>
                                {region.name}
                            </option>
                        ))}
                    </select>
                    {errors.region_id && (
                        <span className={styles.error}>{errors.region_id}</span>
                    )}
                </label>

                <label>
                    <span className={styles.labelContainer}>
                        آدرس <span className={styles.required}>*</span>
                    </span>
                    <input
                        type="text"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        placeholder="آدرس را وارد کنید (مثل کردکوی، گلستان)"
                        dir="rtl"
                        className={styles.locationInput}
                    />
                    {errors.location && (
                        <span className={styles.error}>{errors.location}</span>
                    )}
                </label>

                <label>
                    <span className={styles.labelContainer}>
                        انتخاب موقعیت روی نقشه{' '}
                        <span className={styles.required}>*</span>
                    </span>
                    <MapPicker onMapClick={handleMapClick} center={mapCenter} />
                    {formData.lat && formData.long && (
                        <p className={styles.selectedLocation}>
                            موقعیت انتخاب شده: ({formData.lat}, {formData.long})
                        </p>
                    )}
                    {errors.map && (
                        <span className={styles.error}>{errors.map}</span>
                    )}
                </label>

                <label>
                    <span className={styles.labelContainer}>
                        آپلود تصویر <span className={styles.required}>*</span>
                    </span>
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        multiple
                        onChange={handleChange}
                    />
                    {errors.image && (
                        <span className={styles.error}>{errors.image}</span>
                    )}
                    {images.length > 0 && (
                        <p className={styles.imageCount}>
                            تصاویر آپلودشده: {images.length}
                        </p>
                    )}
                </label>

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'در حال ارسال...' : 'ارسال گزارش'}
                </button>

                {trackingCode && (
                    <p className={styles.trackingInfo}>
                        کد پیگیری شما: <strong>{trackingCode}</strong>
                    </p>
                )}
            </form>
        </section>
    );
};

export default NewReportForm;
