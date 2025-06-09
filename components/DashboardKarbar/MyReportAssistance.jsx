import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "jalali-moment";
import styles from "./DashboardKarbar.module.css";

const MyReportAssistance = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                toast.info("لطفاً برای ادامه وارد شوید", { toastId: "noToken" });
                router.push("/login");
                return;
            }

            const response = await fetch("http://127.0.0.1:8000/api/myReportAssistance", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.info("جلسه شما منقضی شده است. لطفاً دوباره وارد شوید.", { toastId: "unauthorized" });
                    router.push("/login");
                    return;
                }
                throw new Error(`خطای سرور: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            if (data.status && data.data) {
                setReports(data.data);
            } else {
                throw new Error("داده‌های گزارش‌ها دریافت نشد.");
            }
        } catch (err) {
            setError(err.message || "خطایی در دریافت داده‌ها رخ داد.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const statusMap = {
        pending: { label: "در انتظار", class: "pending" },
        in_progress: { label: "در حال بررسی", class: "in_progress" },
        resolved: { label: "حل شده", class: "resolved" },
        unprocessed: { label: "پردازش نشده", class: "unprocessed" },
    };

    if (loading) {
        return <div className={styles.loader}>در حال بارگذاری...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <>
            <div className={styles.myReportAssistance}>
                <h3 className={styles.sectionTitle}>گزارش‌های داوطلب‌شده</h3>
                <div className={styles.tableContainer}>
                    <div className={styles.tableWrapper}>
                        {reports.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>شناسه گزارش</th>
                                        <th>عنوان</th>
                                        <th>موقعیت</th>
                                        <th>وضعیت</th>
                                        <th>داوطلب</th>
                                        <th>تاریخ داوطلبی</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => {
                                        const status = statusMap[report.report.status] || {
                                            label: "نامشخص",
                                            class: "unknown",
                                        };
                                        const volunteerName = report.user
                                            ? `${report.user.name} ${report.user.family}`
                                            : "نامشخص";
                                        return (
                                            <tr key={report.id}>
                                                <td>{report.report_id || "نامشخص"}</td>
                                                <td>{report.report.title || "بدون عنوان"}</td>
                                                <td>{report.report.location || "نامشخص"}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[status.class]}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>{volunteerName}</td>
                                                <td>
                                                    {report.created_at
                                                        ? moment(report.created_at).locale("fa").format("jYYYY/jMM/jDD HH:mm")
                                                        : "نامشخص"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.noData}>هیچ گزارش داوطلب‌شده‌ای وجود ندارد.</p>
                        )}
                    </div>
                </div>
                <ToastContainer
                    rtl
                    position="bottom-right"
                    autoClose={3000}
                    limit={1}
                    hideProgressBar
                    newestOnTop
                    closeOnClick
                    pauseOnHover
                />
            </div>
        </>
    );
};

export default MyReportAssistance;