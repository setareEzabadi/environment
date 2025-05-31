import { useState } from 'react';
import styles from './Campaigns.module.css';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMomentJalaali } from '@mui/x-date-pickers/AdapterMomentJalaali';
import moment from 'moment-jalaali';

const CampaignForm = ({
    formData,
    setFormData,
    statuses,
    editCampaignId,
    handleCreateCampaign,
    handleUpdateCampaign,
}) => {
    // وضعیت خطاها را در یک state نگه می‌داریم
    const [errors, setErrors] = useState({});

    const getStatusText = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'فعال';
            case 'upcoming': return 'آینده';
            case 'ended': return 'پایان‌یافته';
            case 'paused': return 'متوقف';
            default: return status || 'نامشخص';
        }
    };

    const parseDate = (dateStr) => {
        try {
            if (!dateStr) return null;
            const momentDate = moment(dateStr, 'YYYY-MM-DD', true);
            return momentDate.isValid() ? momentDate : null;
        } catch (error) {
            console.error('خطا در پارس تاریخ:', error);
            return null;
        }
    };

    const formatToGregorian = (date) => {
        try {
            if (!date || !moment.isMoment(date)) return '';
            return date.format('YYYY-MM-DD');
        } catch (error) {
            console.error('خطا در فرمت تاریخ:', error);
            return '';
        }
    };

    const minimumDate = moment();

    // ====== ۱. تابع handleInputChange را به‌روزرسانی می‌کنیم ======
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // ابتدا formData را به‌روز می‌کنیم
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // بعد از آن خطای همون فیلد را پاک می‌کنیم (اگر وجود داشته)
        setErrors((prev) => ({
            ...prev,
            [name]: ''  // خطای این فیلد را خالی کن
        }));
    };

    // ====== ۲. تابع validateForm بدون تغییر بماند ======
    const validateForm = () => {
        const newErrors = {};
        if (!formData.title?.trim()) newErrors.title = 'عنوان اجباری است';
        if (!formData.description?.trim()) newErrors.description = 'توضیحات اجباری است';
        if (!formData.status_id) newErrors.status_id = 'وضعیت اجباری است';
        if (!formData.start_date) newErrors.start_date = 'تاریخ شروع اجباری است';
        if (!formData.end_date) newErrors.end_date = 'تاریخ پایان اجباری است';
        if (!formData.location?.trim()) newErrors.location = 'محل اجباری است';
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        editCampaignId ? handleUpdateCampaign(e) : handleCreateCampaign(e);
    };

    return (
        <section className={styles.formSection}>
            <h3>{editCampaignId ? 'ویرایش کمپین' : 'ایجاد کمپین جدید'}</h3>

            <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* ====== فیلد عنوان ====== */}
                    <label>
                        <span className={styles.required}>
                            عنوان: <span className={styles.requiredAsterisk}>*</span>
                        </span>
                        <input
                            type="text"
                            name="title"
                            value={formData.title || ''}
                            onChange={handleInputChange}
                        />
                        {errors.title && (
                            <span className={styles.errorMessage}>{errors.title}</span>
                        )}
                    </label>

                    {/* ====== فیلد توضیحات ====== */}
                    <label>
                        <span className={styles.required}>
                            توضیحات: <span className={styles.requiredAsterisk}>*</span>
                        </span>
                        <textarea
                            name="description"
                            value={formData.description || ''}
                            onChange={handleInputChange}
                            rows="4"
                        />
                        {errors.description && (
                            <span className={styles.errorMessage}>{errors.description}</span>
                        )}
                    </label>

                    {/* ====== فیلد وضعیت ====== */}
                    <label>
                        <span className={styles.required}>
                            وضعیت: <span className={styles.requiredAsterisk}>*</span>
                        </span>
                        <select
                            name="status_id"
                            value={formData.status_id || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">انتخاب کنید</option>
                            {statuses.map((status) => (
                                <option key={status.id} value={status.id}>
                                    {getStatusText(status.status)}
                                </option>
                            ))}
                        </select>
                        {errors.status_id && (
                            <span className={styles.errorMessage}>{errors.status_id}</span>
                        )}
                    </label>

                    {/* ====== فیلد تاریخ شروع ======
                        این قسمت علاوه بر به‌روز کردن formData،
                        خطای start_date را هم پاک می‌کند. */}
                    <label>
                        <span className={styles.required}>
                            تاریخ شروع: <span className={styles.requiredAsterisk}>*</span>
                        </span>
                        <DatePicker
                            value={parseDate(formData.start_date)}
                            onChange={(date) => {
                                // ۱) فرم را به‌روز می‌کنیم
                                const gregorian = formatToGregorian(date);
                                setFormData((prev) => ({
                                    ...prev,
                                    start_date: gregorian
                                }));
                                // ۲) خطای start_date را پاک می‌کنیم
                                setErrors((prev) => ({
                                    ...prev,
                                    start_date: ''
                                }));
                            }}
                            minDate={minimumDate}
                            slotProps={{
                                textField: {
                                    className: styles.datePickerInput,
                                    placeholder: 'انتخاب تاریخ',
                                },
                                popper: {
                                    className: styles.datePickerPopper,
                                },
                            }}
                            format="jYYYY/jMM/jDD"
                        />
                        {errors.start_date && (
                            <span className={styles.errorMessage}>{errors.start_date}</span>
                        )}
                    </label>

                    {/* ====== فیلد تاریخ پایان ======
                        این قسمت علاوه بر به‌روز کردن formData،
                        خطای end_date را هم پاک می‌کند. */}
                    <label>
                        <span className={styles.required}>
                            تاریخ پایان: <span className={styles.requiredAsterisk}>*</span>
                        </span>
                        <DatePicker
                            value={parseDate(formData.end_date)}
                            onChange={(date) => {
                                const gregorian = formatToGregorian(date);
                                setFormData((prev) => ({
                                    ...prev,
                                    end_date: gregorian
                                }));
                                // پاک کردن خطای end_date
                                setErrors((prev) => ({
                                    ...prev,
                                    end_date: ''
                                }));
                            }}
                            minDate={parseDate(formData.start_date) || minimumDate}
                            slotProps={{
                                textField: {
                                    className: styles.datePickerInput,
                                    placeholder: 'انتخاب تاریخ',
                                },
                                popper: {
                                    className: styles.datePickerPopper,
                                },
                            }}
                            format="jYYYY/jMM/jDD"
                        />
                        {errors.end_date && (
                            <span className={styles.errorMessage}>{errors.end_date}</span>
                        )}
                    </label>

                    {/* ====== فیلد محل ====== */}
                    <label>
                        <span className={styles.required}>
                            محل: <span className={styles.requiredAsterisk}>*</span>
                        </span>
                        <input
                            type="text"
                            name="location"
                            value={formData.location || ''}
                            onChange={handleInputChange}
                        />
                        {errors.location && (
                            <span className={styles.errorMessage}>{errors.location}</span>
                        )}
                    </label>

                    <button type="submit" className={styles.submitBtn}>
                        {editCampaignId ? 'ویرایش کمپین' : 'ایجاد کمپین'}
                    </button>
                </form>
            </LocalizationProvider>
        </section>
    );
};

export default CampaignForm;
