import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './DashboardKarbar.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import env from '../../env';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [family, setFamily] = useState('');
    const [email, setEmail] = useState('');
    const [nationalCode, setNationalCode] = useState('');
    const [organization, setOrganization] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        fetch(`${env.baseUrl}api/getUser`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(json => {
                if (!json.status) throw new Error('خطا در دریافت پروفایل');
                const u = json.data;
                setName(u.name || '');
                setFamily(u.family || '');
                setEmail(u.email || '');
                setNationalCode(u.national_code || '');
                setOrganization(u.organization || '');
                setAvatarUrl(u.avatar ? `${env.baseUrl}${u.avatar}` : '');
                setIsAdmin(u.role === 'admin');
            })
            .catch(err => {
                console.error(err);
                toast.error('خطا در بارگذاری اطلاعات کاربر');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = e => {
        e.preventDefault();
        const token = localStorage.getItem('auth_token');
        const formData = new FormData();
        formData.append('name', name);
        formData.append('family', family);
        formData.append('email', email);
        formData.append('nationalCode', nationalCode);
        if (isAdmin) formData.append('organization', organization);
        if (avatarFile) {
            formData.append('avatar', avatarFile, avatarFile.name);
        }

        fetch(`${env.baseUrl}api/UserUpdate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
            .then(res => res.json())
            .then(json => {
                if (json.status) {
                    toast.success('پروفایل با موفقیت بروزرسانی شد');
                    if (json.data && json.data.avatar) {
                        setAvatarUrl(`${env.baseUrl}${json.data.avatar}`);
                    }
                } else {
                    toast.error('خطا در بروزرسانی پروفایل');
                }
            })
            .catch(err => {
                console.error(err);
                toast.error('خطا در ارتباط با سرور');
            });
    };

    const handleSendOtp = e => {
        e.preventDefault();
        if (!phone.match(/^09[0-9]{9}$/)) {
            toast.error('شماره موبایل معتبر نیست');
            return;
        }
        setOtpLoading(true);
        const token = localStorage.getItem('auth_token');
        fetch(`${env.baseUrl}api/sendOtp`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone }),
        })
            .then(res => res.json())
            .then(json => {
                if (json.status) {
                    setOtpSent(true);
                    toast.success('کد تأیید ارسال شد');
                } else {
                    toast.error('خطا در ارسال کد تأیید');
                }
            })
            .catch(err => {
                console.error(err);
                toast.error('خطا در ارتباط با سرور');
            })
            .finally(() => setOtpLoading(false));
    };

    const handleOtpChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleVerifyOtp = e => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6 || !/^[0-9]{6}$/.test(otpCode)) {
            toast.error('کد تأیید معتبر نیست');
            return;
        }
        setOtpLoading(true);
        const token = localStorage.getItem('auth_token');
        fetch(`${env.baseUrl}api/phoneUpdate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone, otp: otpCode }),
        })
            .then(res => res.json())
            .then(json => {
                if (json.status) {
                    toast.success('شماره موبایل با موفقیت بروزرسانی شد');
                    setOtpSent(false);
                    setOtp(['', '', '', '', '', '']);
                    setPhone('');
                } else {
                    toast.error('خطا در تأیید کد');
                }
            })
            .catch(err => {
                console.error(err);
                toast.error('خطا در ارتباط با سرور');
            })
            .finally(() => setOtpLoading(false));
    };

    const handleChangePasswordRedirect = () => {
        router.push({
            pathname: '/login',
            query: { step: 'change' }
        });
    };

    if (loading) {
        return <div className={styles.loading}>در حال بارگذاری...</div>;
    }

    return (
        <div className={styles.profile}>
            <h2>ویرایش پروفایل</h2>
            <div className={styles.toolbar}>
                <button
                    className={`${styles.toolbarBtn} ${activeSection === 'personal' ? styles.active : ''}`}
                    onClick={() => setActiveSection('personal')}
                >
                    اطلاعات شخصی
                </button>
                <button
                    className={`${styles.toolbarBtn} ${activeSection === 'phone' ? styles.active : ''}`}
                    onClick={() => setActiveSection('phone')}
                >
                    تغییر شماره موبایل
                </button>
                <button
                    className={styles.toolbarBtn}
                    onClick={handleChangePasswordRedirect}
                >
                    تغییر رمز عبور
                </button>
            </div>

            {activeSection === 'personal' && (
                <div className={`${styles.section} ${styles.fadeIn}`}>
                    <h3>اطلاعات شخصی</h3>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.avatarContainer}>
                            <label htmlFor="avatarInput" className={styles.avatarLabel}>
                                {avatarFile ? (
                                    <img
                                        src={URL.createObjectURL(avatarFile)}
                                        alt="آواتار"
                                        className={styles.avatarPreview}
                                    />
                                ) : avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="آواتار"
                                        className={styles.avatarPreview}
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        <span>+</span>
                                    </div>
                                )}
                            </label>
                            <input
                                id="avatarInput"
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file && /^image\/(jpeg|png|jpg|gif|svg\+xml)$/.test(file.type)) {
                                        setAvatarFile(file);
                                    } else {
                                        setAvatarFile(null);
                                        toast.warn('لطفاً یک فایل تصویری معتبر انتخاب کنید');
                                    }
                                }}
                                className={styles.avatarInput}
                            />
                        </div>
                        <label>
                            نام
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            نام خانوادگی
                            <input
                                type="text"
                                value={family}
                                onChange={(e) => setFamily(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            ایمیل
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            کد ملی
                            <input
                                type="text"
                                value={nationalCode}
                                onChange={(e) => setNationalCode(e.target.value)}
                                required
                            />
                        </label>
                        {isAdmin && (
                            <label>
                                سازمان
                                <input
                                    type="text"
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                />
                            </label>
                        )}
                        <button type="submit" className={styles.submitBtn}>
                            ثبت تغییرات
                        </button>
                    </form>
                </div>
            )}

            {activeSection === 'phone' && (
                <div className={`${styles.section} ${styles.fadeIn}`}>
                    <h3>تغییر شماره موبایل</h3>
                    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className={styles.phoneForm}>
                        <label>
                            شماره موبایل
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="09123456789"
                                required
                                disabled={otpLoading}
                            />
                        </label>
                        {otpSent && (
                            <>
                                <label>کد تأیید</label>
                                <div className={styles.otpInputs}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={e => handleOtpChange(index, e.target.value)}
                                            className={styles.otpInput}
                                            required
                                            disabled={otpLoading}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        {!otpSent ? (
                            <button
                                type="submit"
                                className={styles.otpBtn}
                                disabled={otpLoading}
                            >
                                {otpLoading ? 'در حال ارسال...' : 'ارسال کد تأیید'}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className={styles.verifyBtn}
                                disabled={otpLoading}
                            >
                                {otpLoading ? 'در حال تأیید...' : 'تأیید کد'}
                            </button>
                        )}
                    </form>
                </div>
            )}

            <ToastContainer rtl position="bottom-right" autoClose={3000} />
        </div>
    );
};

export default Profile;