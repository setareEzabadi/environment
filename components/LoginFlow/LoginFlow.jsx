import React, { useState } from 'react';
import styles from './LoginFlow.module.css';
import env from '../../env';
import OtpInput from './OtpInput';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ToastReaction from '../../plugins/ToastReaction/ToastReaction';

const LoginFlow = () => {
    // مراحل: "phone" → "password" → "otp" → "forgot" → "change" → "register"
    const [step, setStep] = useState("phone");
    const [method, setMethod] = useState(null); // "password" یا "otp"
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerData, setRegisterData] = useState({ name: "", family: "", email: "", password: "" });

    // API توابع – نمونه؛ در محیط واقعی مدیریت خطا و بارگذاری را اضافه کنید
    const sendOtp = async () => {
        const res = await fetch(`${env.baseUrl}api/sendOtp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
        });
        return await res.json();
    };

    const verifyOtp = async (enteredOtp) => {
        const res = await fetch(`${env.baseUrl}api/verifyOtp?phone=${phone}&otp=${enteredOtp}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, otp: enteredOtp })
        });
        return await res.json(); // انتظار: { status: true, message: "...", phone: "...", userExisted: true/false }
    };

    const checkPassword = async () => {
        const res = await fetch(`${env.baseUrl}api/checkPassword`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password })
        });
        return await res.json(); // انتظار: { status: true, message: "پسورد صحیح است.", user: { … } }
    };

    const changePassword = async (data) => {
        const token = localStorage.getItem("auth_token");

        const res = await fetch(`${env.baseUrl}api/chengePassword`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                phone,
                newPass: data.newPassword,
                confirm: data.confirmPassword
            })
        });
        return await res.json();
    };

    const userRegister = async () => {
        const res = await fetch(`${env.baseUrl}api/userRegister`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, ...registerData })
        });
        return await res.json();
    };

    // اعتبارسنجی ساده شماره موبایل
    const validatePhone = (value) => {
        const regex = /^09\d{9}$/;
        if (!value) {
            return "شماره موبایل الزامی است";
        } else if (!regex.test(value)) {
            return "شماره موبایل معتبر نیست";
        }
        return "";
    };

    // هندلر مرحله شماره موبایل
    const handlePhoneSubmit = (e) => {
        e.preventDefault();
        const error = validatePhone(phone);
        if (error) {
            setPhoneError(error);
        } else {
            setPhoneError("");
            // شماره موبایل معتبر است؛ کاربر باید یکی از دو گزینه انتخاب کند
        }
    };

    // هندلر ورود با پسورد
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!password) {
            toast.error("لطفاً پسورد را وارد کنید", ToastReaction.error);
            return;
        }
        const res = await checkPassword();
        if (res.status) {
            toast.success("ورود موفقیت آمیز بود", ToastReaction.success);
            localStorage.setItem("auth_token", res.token);
            localStorage.setItem("auth_user", JSON.stringify(res.user));

            window.location.href = "/";
        } else {
            toast.error("پسورد اشتباه است", ToastReaction.error);
        }
    };

    // هندلر تایید OTP برای ورود با کد یکبار مصرف
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("کد باید 6 رقمی باشد", ToastReaction.error);
            return;
        }
        const res = await verifyOtp(otp);
        if (res.status && res.userExisted) {
            toast.success("ورود موفق", ToastReaction.success);
            // ریدایرکت به داشبورد
        } else {
            setStep("register");
        }
    };

    // هندلر تایید OTP برای فراموشی رمز عبور (forgot)
    const handleForgotOtpSubmit = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("کد باید 6 رقمی باشد", ToastReaction.error);
            return;
        }
        const res = await verifyOtp(otp);
        if (res.status) {
            if (!res.userExisted) {
                toast.warning("ابتدا باید ثبت‌نام کنید", ToastReaction.warning);
                setStep("register");
            } else {
                localStorage.setItem("auth_token", res.token);
                setStep("change");
            }
        } else {
            toast.error("کد تایید اشتباه است", ToastReaction.error);
        }
    };

    // هندلر تغییر رمز عبور
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.error("رمزعبور جدید حداقل 6 کاراکتر باشد", ToastReaction.error);
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("رمزها مطابقت ندارند", ToastReaction.error);
            return;
        }
        const res = await changePassword({ newPassword, confirmPassword });
        if (res.status) {
            toast.success("رمزعبور با موفقیت تغییر یافت", ToastReaction.success);
            setStep("phone");
        } else {
            toast.error("خطا در تغییر رمزعبور", ToastReaction.error);
        }
    };

    // هندلر ثبت نام
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!registerData.name || !registerData.family || !registerData.email || !registerData.password) {
            toast.error("لطفاً تمامی موارد را وارد کنید", ToastReaction.error);
            return;
        }
        if (registerData.password.length < 6) {
            toast.error("پسورد حداقل 6 کاراکتر باید باشد", ToastReaction.error);
            return;
        }
        const res = await userRegister();
        if (res.status) {
            toast.success("ثبت نام موفق", ToastReaction.success);

            localStorage.setItem("auth_token", res.token);
            localStorage.setItem("auth_user", JSON.stringify(res.user));

            window.location.href = "/";
        } else {
            toast.error("خطا در ثبت نام", ToastReaction.error);
        }
    };

    return (
        <div className={styles.parent}>
            <ToastContainer position="bottom-left" rtl autoClose={3000} />
            <div className={styles.loginFlow}>
                {step === "phone" && (
                    <div className={styles.formContainer}>
                        <h2>ورود / ثبت نام</h2>
                        <form className={styles.form} onSubmit={handlePhoneSubmit}>
                            <label className={styles.label}>شماره موبایل</label>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="09xxxxxxxxx"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            {phoneError && <div className={styles.error}>{phoneError}</div>}
                            <div className={styles.buttonGroup}>
                                <button
                                    type="button"
                                    className={styles.button}
                                    onClick={() => {
                                        const error = validatePhone(phone);
                                        if (error) {
                                            setPhoneError(error);
                                        } else {
                                            setPhoneError("");
                                            setMethod("password");
                                            setStep("password");
                                        }
                                    }}
                                >
                                    ورود با پسورد
                                </button>
                                <button
                                    type="button"
                                    className={styles.button}
                                    onClick={async () => {
                                        const error = validatePhone(phone);
                                        if (error) {
                                            setPhoneError(error);
                                        } else {
                                            setPhoneError("");
                                            setMethod("otp");
                                            await sendOtp();
                                            setStep("otp");
                                        }
                                    }}
                                >
                                    ورود با کد یکبار مصرف
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === "password" && (
                    <div className={styles.formContainer}>
                        <h2>ورود با پسورد</h2>
                        <p className={styles.info}>شماره: {phone}</p>
                        <form className={styles.form} onSubmit={handlePasswordSubmit}>
                            <label className={styles.label}>پسورد</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button className={styles.button} type="submit">ورود</button>
                        </form>
                        <button
                            className={styles.linkBtn}
                            onClick={async () => {
                                await sendOtp();
                                setStep("forgot");
                            }}
                        >
                            فراموشی رمزعبور
                        </button>
                    </div>
                )}

                {step === "otp" && method === "otp" && (
                    <div className={styles.formContainer}>
                        <h2>ورود با کد یکبار مصرف</h2>
                        <p className={styles.info}>کد ارسال شده به {phone}</p>
                        <form className={styles.form} onSubmit={handleOtpSubmit}>
                            <label className={styles.label}>کد یکبار مصرف</label>
                            <OtpInput value={otp} onChange={setOtp} />
                            <button className={styles.button} type="submit">تایید</button>
                        </form>
                    </div>
                )}

                {step === "forgot" && (
                    <div className={styles.formContainer}>
                        <h2>بازیابی رمزعبور</h2>
                        <p className={styles.info}>کد ارسال شده به {phone}</p>
                        <form className={styles.form} onSubmit={handleForgotOtpSubmit}>
                            <label className={styles.label}>کد یکبار مصرف</label>
                            <OtpInput value={otp} onChange={setOtp} />
                            <button className={styles.button} type="submit">تایید</button>
                        </form>
                    </div>
                )}

                {step === "change" && (
                    <div className={styles.formContainer}>
                        <h2>تغییر رمزعبور</h2>
                        <form className={styles.form} onSubmit={handleChangePassword}>
                            <label className={styles.label}>رمزعبور جدید</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="رمزعبور جدید"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <label className={styles.label}>تایید رمزعبور</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="تایید رمزعبور"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button className={styles.button} type="submit">تغییر رمزعبور</button>
                        </form>
                    </div>
                )}

                {step === "register" && (
                    <div className={styles.formContainer}>
                        <h2>ثبت نام</h2>
                        <form className={styles.form} onSubmit={handleRegister}>
                            <label className={styles.label}>نام</label>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="نام"
                                value={registerData.name}
                                onChange={(e) =>
                                    setRegisterData({ ...registerData, name: e.target.value })
                                }
                            />
                            <label className={styles.label}>نام خانوادگی</label>
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="نام خانوادگی"
                                value={registerData.family}
                                onChange={(e) =>
                                    setRegisterData({ ...registerData, family: e.target.value })
                                }
                            />
                            <label className={styles.label}>ایمیل</label>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="ایمیل"
                                value={registerData.email}
                                onChange={(e) =>
                                    setRegisterData({ ...registerData, email: e.target.value })
                                }
                            />
                            <label className={styles.label}>پسورد</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="پسورد"
                                value={registerData.password}
                                onChange={(e) =>
                                    setRegisterData({ ...registerData, password: e.target.value })
                                }
                            />
                            <button className={styles.button} type="submit">ثبت نام</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginFlow;
