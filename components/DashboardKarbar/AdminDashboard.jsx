import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import styles from "./DashboardKarbar.module.css";
import env from "../../env";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const printRef = useRef();

    const handlePrint = () => {
        const printContents = printRef.current.innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            if (!token) {
                toast.info("لطفاً برای ادامه وارد شوید", { toastId: "noToken" });
                router.push("/login");
                return;
            }

            const response = await fetch(`${env.baseUrl}api/adminDashboardStats`, {
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
                setDashboardData(data.data);
            } else {
                throw new Error("داده‌های داشبورد دریافت نشد.");
            }
        } catch (err) {
            setError(err.message || "خطایی در دریافت داده‌ها رخ داد.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className={styles.loader}>در حال بارگذاری...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!dashboardData) {
        return <div className={styles.error}>داده‌ای برای نمایش وجود ندارد.</div>;
    }

    const { reports = {}, users = {}, campaigns = {}, regions = {} } = dashboardData;

    // Data for Pie Chart (Report Status Distribution)
    const statusData = [
        {
            label: "حل شده",
            count: (reports.status_distribution || []).find((s) => s.status === "resolved")?.count || 0,
            color: "#10b981",
        },
        {
            label: "پردازش نشده",
            count: (reports.status_distribution || []).find((s) => s.status === "unprocessed")?.count || 0,
            color: "#ef4444",
        },
        {
            label: "در حال بررسی",
            count: (reports.status_distribution || []).find((s) => s.status === "in_progress")?.count || 0,
            color: "#3b82f6",
        },
        {
            label: "در انتظار",
            count: (reports.status_distribution || []).find((s) => s.status === "pending")?.count || 0,
            color: "#f59e0b",
        },
    ];

    const totalStatusCount = statusData.reduce((sum, item) => sum + item.count, 0);
    let startAngle = 0;

    // Calculate angles for pie chart
    const pieSegments = statusData.map((item) => {
        const percentage = totalStatusCount > 0 ? (item.count / totalStatusCount) * 360 : 0;
        const endAngle = startAngle + percentage;
        const largeArcFlag = percentage > 180 ? 1 : 0;
        const startX = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
        const startY = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
        const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
        const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
        const path = `M 100,100 L ${startX},${startY} A 80,80 0 ${largeArcFlag},1 ${endX},${endY} Z`;
        startAngle = endAngle;
        return { path, color: item.color, label: item.label, count: item.count };
    });

    // Data for Bar Chart (Top Categories)
    const barData = (reports.top_categories || []).map((cat) => ({
        label: cat.category?.name || "نامشخص",
        count: cat.count || 0,
    }));

    const maxBarCount = Math.max(...barData.map((item) => item.count), 1);
    const barWidth = barData.length > 0 ? 100 / barData.length - 10 : 0;

    // Status mapping for campaigns
    const statusMap = {
        1: { label: "در انتظار", class: "pending" },
        2: { label: "در حال انجام", class: "in_progress" },
        3: { label: "حل شده", class: "resolved" },
        4: { label: "پردازش نشده", class: "unprocessed" },
    };

    return (
        <>
            <div className={styles.printButtonWrapper}>
                <button onClick={handlePrint} className={styles.printButton}>
                    🖨 چاپ داشبورد
                </button>
            </div>
            <div className={styles.adminDashboard} ref={printRef}>
                <h2 className={styles.sectionTitle}>داشبورد ادمین</h2>

                {/* Summary Cards */}
                <div className={styles.summaryCards}>
                    <div className={styles.card}>
                        <h3>تعداد کل گزارش‌ها</h3>
                        <p>{reports.total || 0}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>تعداد کل کاربران</h3>
                        <p>{users.total || 0}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>تعداد کل کمپین‌ها</h3>
                        <p>{campaigns.total || 0}</p>
                    </div>
                    <div className={styles.card}>
                        <h3>کاربران جدید امروز</h3>
                        <p>{users.new_today || 0}</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className={styles.chartsSection}>
                    {/* Pie Chart */}
                    <div className={styles.chartContainer}>
                        <h3>توزیع وضعیت گزارش‌ها</h3>
                        <div className={styles.chartWrapper}>
                            <svg viewBox="0 0 200 200" className={styles.pieChart}>
                                {pieSegments.map((segment, index) => (
                                    <path key={index} d={segment.path} fill={segment.color} />
                                ))}
                            </svg>
                            <div className={styles.chartLegend}>
                                {statusData.map((item, index) => (
                                    <div key={index} className={styles.legendItem}>
                                        <span className={styles.legendColor} style={{ backgroundColor: item.color }}></span>
                                        <span>
                                            {item.label}: {item.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className={styles.chartContainer}>
                        <h3>دسته‌بندی‌های پرگزارش</h3>
                        <div className={styles.chartWrapper}>
                            {barData.length > 0 ? (
                                <svg viewBox="0 0 100 100" className={styles.barChart}>
                                    {/* Grid Lines for Y-Axis */}
                                    {[0, 0.25, 0.5, 0.75, 1].map((tick, index) => (
                                        <line
                                            key={index}
                                            x1="2"
                                            y1={100 - tick * 80}
                                            x2="100"
                                            y2={100 - tick * 80}
                                            stroke="#e2e8f0"
                                            strokeWidth="0.3"
                                            strokeDasharray="2,2"
                                        />
                                    ))}
                                    {/* Bars */}
                                    {barData.map((item, index) => {
                                        const height = (item.count / maxBarCount) * 80;
                                        const x = index * (barWidth + 10) + 5;
                                        const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
                                        const fillColor = colors[index % colors.length];
                                        return (
                                            <g key={index}>
                                                <rect
                                                    x={x}
                                                    y={100 - height}
                                                    width={barWidth}
                                                    height={height}
                                                    fill={fillColor}
                                                    stroke={fillColor}
                                                    strokeWidth="0.5"
                                                    className={styles.bar}
                                                />
                                                <text
                                                    x={x + barWidth / 2}
                                                    y={100 - height - 2}
                                                    textAnchor="middle"
                                                    fontSize="3.5"
                                                    fill="#1e293b"
                                                    className={styles.barLabel}
                                                >
                                                    {item.count}
                                                </text>
                                                <text
                                                    x={x + barWidth / 2}
                                                    y="102"
                                                    textAnchor="middle"
                                                    fontSize="3"
                                                    fill="#1e293b"
                                                    className={styles.barLabel}
                                                >
                                                    {item.label}
                                                </text>
                                            </g>
                                        );
                                    })}
                                    {/* Y-Axis */}
                                    <line x1="2" y1="10" x2="2" y2="100" stroke="#1e293b" strokeWidth="0.5" />
                                    <text x="0" y="8" fontSize="4" fill="#1e293b">
                                        تعداد
                                    </text>
                                    {/* X-Axis */}
                                    <line x1="2" y1="100" x2="100" y2="100" stroke="#1e293b" strokeWidth="0.5" />
                                    <text x="50" y="108" textAnchor="middle" fontSize="4" fill="#1e293b">
                                        دسته‌بندی
                                    </text>
                                </svg>
                            ) : (
                                <p className={styles.noData}>داده‌ای برای نمایش وجود ندارد.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tables Section */}
                <div className={styles.tablesSection}>
                    {/* Top Contributors Table */}
                    <div className={styles.tableContainer}>
                        <h3>برترین مشارکت‌کنندگان</h3>
                        <div className={styles.tableWrapper}>
                            {(users.top_contributors || []).length > 0 ? (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>نام</th>
                                            <th>ایمیل</th>
                                            <th>تعداد گزارش‌ها</th>
                                            <th>نقش</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(users.top_contributors || []).map((user) => (
                                            <tr key={user.id || `user-${Math.random()}`}>
                                                <td>{`${user.name || "نامشخص"} ${user.family || ""}`}</td>
                                                <td>{user.email || "نامشخص"}</td>
                                                <td>{user.reports_count || 0}</td>
                                                <td>{user.role === "admin" ? "ادمین" : "کاربر"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className={styles.noData}>هیچ مشارکت‌کننده‌ای وجود ندارد.</p>
                            )}
                        </div>
                    </div>

                    {/* Top Campaigns Table */}
                    <div className={styles.tableContainer}>
                        <h3>برترین کمپین‌ها</h3>
                        <div className={styles.tableWrapper}>
                            {(campaigns.top_campaigns || []).length > 0 ? (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>عنوان</th>
                                            <th>محل</th>
                                            <th>تعداد شرکت‌کنندگان</th>
                                            <th>وضعیت</th>
                                            <th>تاریخ شروع</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(campaigns.top_campaigns || []).map((campaign) => {
                                            const status = statusMap[campaign.status_id] || {
                                                label: "نامشخص",
                                                class: "unknown",
                                            };
                                            return (
                                                <tr key={campaign.id || `campaign-${Math.random()}`}>
                                                    <td>{campaign.title || "بدون عنوان"}</td>
                                                    <td>{campaign.location || "نامشخص"}</td>
                                                    <td>{campaign.participants_count || 0}</td>
                                                    <td>
                                                        <span
                                                            className={`${styles.statusBadge} ${styles[status.class]}`}
                                                        >
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td>{campaign.start_date || "نامشخص"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <p className={styles.noData}>هیچ کمپینی وجود ندارد.</p>
                            )}
                        </div>
                    </div>

                    {/* Most Reported Regions Table */}
                    <div className={styles.tableContainer}>
                        <h3>مناطق پرگزارش</h3>
                        <div className={styles.tableWrapper}>
                            {(regions.most_reported || []).length > 0 ? (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>نام منطقه</th>
                                            <th>تعداد گزارش‌ها</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(regions.most_reported || []).map((region, index) => (
                                            <tr key={region.region_id || `region-${index}`}>
                                                <td>{region.region?.name || "نامشخص"}</td>
                                                <td>{region.count || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className={styles.noData}>هیچ منطقه‌ای گزارش نشده است.</p>
                            )}
                        </div>
                    </div>
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
                className={styles.toastContainer}
            />
        </>
    );
};

export default AdminDashboard;