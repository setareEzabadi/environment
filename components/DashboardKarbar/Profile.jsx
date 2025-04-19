import React, { useState, useEffect } from 'react';
import styles from './DashboardKarbar.module.css';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [nationalCode, setNationalCode] = useState('');
    const [organization, setOrganization] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        fetch('http://127.0.0.1:8000/api/getUser', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(json => {
                if (!json.status) throw new Error('خطا در دریافت پروفایل');
                const u = json.data;
                setName(u.name || '');
                setEmail(u.email || '');
                setNationalCode(u.national_code || '');
                setOrganization(u.organization || '');
                setIsAdmin(u.role === 'admin');
            })
            .catch(err => {
                console.error(err);
                alert('خطا در بارگذاری اطلاعات کاربر');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = e => {
        e.preventDefault();
        const token = localStorage.getItem('auth_token');
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('national_code', nationalCode);
        if (isAdmin) formData.append('organization', organization);
        if (avatarFile) {
            formData.append('avatar', avatarFile, avatarFile.name);
        }

        fetch('http://127.0.0.1:8000/api/UserUpdate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
            .then(res => res.json())
            .then(json => {
                if (json.status) {
                    alert('پروفایل با موفقیت بروزرسانی شد');
                } else {
                    alert('خطا در بروزرسانی پروفایل');
                }
            })
            .catch(err => {
                console.error(err);
                alert('خطا در ارتباط با سرور');
            });
    };

    if (loading) {
        return <div className={styles.loading}>در حال بارگذاری...</div>;
    }

    return (
        <div className={styles.profile}>
            <h2>ویرایش پروفایل</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
                <label>
                    نام و نام خانوادگی
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </label>

                <label>
                    ایمیل
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </label>

                <label>
                    کد ملی
                    <input
                        type="text"
                        value={nationalCode}
                        onChange={e => setNationalCode(e.target.value)}
                        required
                    />
                </label>

                <label>
                    آواتار
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
                        onChange={e => {
                            const file = e.target.files[0];
                            if (file && /^image\/(jpeg|png|jpg|gif|svg\+xml)$/.test(file.type)) {
                                setAvatarFile(file);
                            } else {
                                setAvatarFile(null);
                                alert('لطفاً یک فایل تصویری معتبر انتخاب کنید');
                            }
                        }}
                    />
                </label>

                {isAdmin && (
                    <label>
                        سازمان
                        <input
                            type="text"
                            value={organization}
                            onChange={e => setOrganization(e.target.value)}
                        />
                    </label>
                )}

                <button type="submit" className={styles.submitBtn}>
                    ثبت تغییرات
                </button>
            </form>
        </div>
    );
};

export default Profile;
