import React, { useState, useEffect } from "react";
import styles from "./DashboardKarbar.module.css";
import env from "../../env";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserManagement = () => {
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("auth_token");
                if (!token) {
                    throw new Error("توکن احراز هویت یافت نشد. لطفاً دوباره وارد شوید.");
                }

                const response = await fetch(`${env.baseUrl}api/getUsers`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`خطای سرور: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();
                if (data.status) {
                    setUsersList(data.data);
                } else {
                    throw new Error("داده‌های کاربران دریافت نشد.");
                }
            } catch (err) {
                setError(err.message || "خطایی در دریافت داده‌ها رخ داد.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleChangeRole = async (userId, newRole) => {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                throw new Error("توکن احراز هویت یافت نشد. لطفاً دوباره وارد شوید.");
            }

            const response = await fetch(`${env.baseUrl}api/changeUserRole`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_id: userId, role: newRole }),
            });

            if (!response.ok) {
                throw new Error(`خطای سرور: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            if (data.status) {
                setUsersList((prev) =>
                    prev.map((user) =>
                        user.id === userId ? { ...user, role: newRole } : user
                    )
                );
                toast.success("نقش کاربر با موفقیت تغییر کرد.", {
                    position: "bottom-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progressStyle: { background: "#10b981" },
                    theme: "light",
                });
            } else {
                throw new Error(data.message || "تغییر نقش ناموفق بود.");
            }
        } catch (err) {
            toast.error(err.message || "خطایی در تغییر نقش رخ داد.", {
                position: "bottom-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progressStyle: { background: "#ef4444" },
                theme: "light",
            });
        }
    };

    return (
        <div className={styles.usersSection}>
            <ToastContainer />
            <h2 className={styles.sectionTitle}>مدیریت کاربران</h2>
            {loading ? (
                <div className={styles.loader}>در حال بارگذاری...</div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : (
                <div className={styles.tableContainer}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>نام</th>
                                    <th>ایمیل</th>
                                    <th>نقش</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.map((user) => (
                                    <tr key={user.id}>
                                        <td>{`${user.name} ${user.family}`}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role === "admin" ? "ادمین" : "کاربر"}</td>
                                        <td>
                                            <select
                                                className={styles.roleSelect}
                                                value={user.role}
                                                onChange={(e) =>
                                                    handleChangeRole(user.id, e.target.value)
                                                }
                                            >
                                                <option value="admin">ادمین</option>
                                                <option value="user">کاربر</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;