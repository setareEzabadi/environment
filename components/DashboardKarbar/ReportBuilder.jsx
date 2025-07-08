import React, { useState, useEffect } from "react";
import styles from "./DashboardKarbar.module.css";
import env from "../../env";
import { FaPlus, FaTrash, FaPlay, FaPrint } from "react-icons/fa";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMomentJalaali } from "@mui/x-date-pickers/AdapterMomentJalaali";
import moment from "moment-jalaali";

// تابع کمکی برای دسترسی به فیلدهای تودرتو
const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
};

const ReportBuilder = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [fields, setFields] = useState([]);
    const [filters, setFilters] = useState([{ field: "", operator: "", value: "", value2: "" }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [results, setResults] = useState([]);

    const token = localStorage.getItem("auth_token");

    // تابع برای ترجمه وضعیت‌ها به فارسی
    const getStatusText = (status) => {
        let statusValue = typeof status === "object" && status !== null ? status.status : status;
        statusValue = typeof statusValue === "number" ? statusValue.toString() : statusValue;
        if (!statusValue) return "نامشخص";
        switch (statusValue.toLowerCase()) {
            case "active":
                return "فعال";
            case "upcoming":
                return "در انتظار شروع";
            case "ended":
                return "پایان‌یافته";
            case "paused":
                return "متوقف";
            case "pending":
                return "در انتظار";
            case "in_progress":
                return "در حال بررسی";
            case "resolved":
                return "حل شده";
            case "unprocessed":
                return "پردازش‌نشده";
            default:
                return statusValue;
        }
    };

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch(`${env.baseUrl}api/query/tables`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) throw new Error("خطا در دریافت جداول");
                const data = await response.json();
                setTables(data.tables);
            } catch (err) {
                setError("خطا در دریافت لیست جداول");
            }
        };
        fetchTables();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            const fetchFields = async () => {
                try {
                    const response = await fetch(`${env.baseUrl}api/query/fields?table=${selectedTable}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ table: selectedTable }),
                    });
                    if (!response.ok) throw new Error("خطا در دریافت فیلدها");
                    const data = await response.json();
                    setFields([...data.fields]);
                    setFilters([{ field: "", operator: "", value: "", value2: "" }]);
                } catch (err) {
                    setError("خطا در دریافت فیلدهای جدول");
                }
            };
            fetchFields();
        }
    }, [selectedTable]);

    const getOperators = (fieldType) => {
        if (fieldType === "date") {
            return [
                { value: "=", label: "مساوی" },
                { value: ">", label: "بزرگ‌تر از" },
                { value: "<", label: "کوچک‌تر از" },
                { value: "between", label: "بین" },
            ];
        }
        return [{ value: "=", label: "مساوی" }, { value: "like", label: "شامل" }];
    };

    const addFilter = () => {
        setFilters([...filters, { field: "", operator: "", value: "", value2: "" }]);
    };

    const removeFilter = (index) => {
        if (filters.length === 1) {
            setFilters([{ field: "", operator: "", value: "", value2: "" }]);
        } else {
            setFilters(filters.filter((_, i) => i !== index));
        }
    };

    const updateFilter = (index, key, value) => {
        const newFilters = [...filters];
        newFilters[index][key] = value;
        setFilters(newFilters);
    };

    const runQuery = async () => {
        setLoading(true);
        setError("");
        try {
            const query = filters
                .map((f) => ({
                    field: f.field,
                    operator: f.operator,
                    value: f.value,
                    ...(f.operator === "between" && f.value2 ? { value2: f.value2 } : {}),
                }))
                .filter((f) => f.field && f.operator && f.value);
            const response = await fetch(`${env.baseUrl}api/query/run`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ table: selectedTable, filters: query }),
            });
            if (!response.ok) throw new Error("خطا در اجرای کوئری");
            const data = await response.json();
            setResults(data.data);
        } catch (err) {
            setError("خطا در اجرای کوئری");
        } finally {
            setLoading(false);
        }
    };

    const formatJalaliDate = (dateStr) => {
        if (!dateStr) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && dateStr.startsWith("14")) {
            return dateStr.replace(/-/g, "/");
        }
        return moment(dateStr).format("jYYYY/jMM/jDD");
    };

    const formatJalaliDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return "";
        return moment(dateTimeStr).format("jYYYY/jMM/jDD HH:mm:ss");
    };

    const handlePrint = () => {
        const printContent = document.getElementById("printableTable").innerHTML;
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
      <html>
        <head>
          <title>گزارش</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: iranSans, sans-serif; direction: rtl; }
            table { width: 100%; max-width: 190mm; border-collapse: collapse; margin: 20px 0; font-size: 9pt; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: right; word-wrap: break-word; white-space: normal; max-width: 30mm; overflow: hidden; }
            th { background-color: #f4f4f4; font-size: 9pt; }
            @media print {
              body { margin: 0; padding: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const headerTranslations = {
        id: "شناسه",
        organizer_id: "شناسه برگزارکننده",
        title: "عنوان",
        description: "توضیحات",
        end_date: "تاریخ پایان",
        location: "محل",
        start_date: "تاریخ شروع",
        status_id: "شناسه وضعیت",
        created_at: "ایجاد شده",
        updated_at: "به‌روزرسانی شده",
        category_id: "شناسه دسته‌بندی",
        lat: "عرض جغرافیایی",
        long: "طول جغرافیایی",
        region_id: "شناسه منطقه",
        status: "وضعیت",
        user_id: "شناسه کاربر",
        campaign_id: "شناسه کمپین",
        name: "نام",
        family: "نام خانوادگی",
        email: "ایمیل",
        email_verified_at: "تایید ایمیل",
        national_code: "کدملی",
        organization: "سازمان",
        phone: "تلفن",
        points: "امتیازات",
        role: "نقش",
        amount: "مبلغ",
        ref_number: "شماره مرجع",
        track_id: "شناسه رهگیری",
        report_id: "شناسه گزارش",
        "category.name": "نام دسته‌بندی",
        "region.name": "نام منطقه",
        "user.name": "نام کاربر",
        "user.family": "نام خانوادگی کاربر",
        "campaign.title": "عنوان کمپین",
    };

    const renderDynamicTable = () => {
        if (results.length === 0) {
            return (
                <div className={styles.noData}>
                    هیچ داده‌ای وجود ندارد
                </div>
            );
        }

        let displayFields = [];
        if (selectedTable === "users") {
            displayFields = [
                "id",
                "name",
                "family",
                "email",
                "phone",
                "role",
                "organization",
                "national_code",
            ];
        } else if (selectedTable === "reports") {
            displayFields = [
                "id",
                "title",
                "description",
                "location",
                "category.name",
                "region.name",
                "user.name",
                "user.family",
                "status",
            ];
        } else {
            displayFields = [
                "id",
                "title",
                "description",
                "location",
                "category.name",
                "region.name",
                "user.name",
                "user.family",
                "campaign.title",
                "start_date",
                "end_date",
                "status",
            ];
        }

        // فیلتر کردن فیلدهایی که داده دارند
        displayFields = displayFields.filter((field) => {
            return results.some((item) => getNestedValue(item, field) !== null);
        });

        return (
            <div id="printableTable" className={styles.tableWrapper}>
                <table className={styles.resultsTable}>
                    <thead>
                        <tr>
                            {displayFields.map((header) => (
                                <th key={header}>{headerTranslations[header] || header.replace(/_/g, " ")}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((item, index) => (
                            <tr key={index}>
                                {displayFields.map((header) => (
                                    <td key={header}>
                                        {(() => {
                                            const value = getNestedValue(item, header);
                                            if (value === null || value === "") return "—";
                                            if (header === "status") {
                                                return getStatusText(value);
                                            }
                                            if (header.includes("date") && selectedTable !== "users") {
                                                return formatJalaliDate(value);
                                            }
                                            return value;
                                        })()}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={styles.reportBuilder}>
            <div className={styles.header}>
                <h3>📊 گزارش ساز</h3>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.filterSection}>
                <h3>ساخت گزارش دلخواه</h3>
                <div className={styles.tableSelection}>
                    <label className={styles.inputLabel}>جدول مورد نظر:</label>
                    <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className={styles.tableSelect}
                    >
                        <option value="">یک جدول انتخاب کنید</option>
                        {tables.map((table) => (
                            <option key={table.key} value={table.key}>
                                {table.label}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedTable && (
                    <div className={styles.filtersContainer}>
                        {filters.map((filter, index) => (
                            <div key={index} className={styles.filterRow}>
                                <select
                                    value={filter.field}
                                    onChange={(e) => updateFilter(index, "field", e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="">فیلد</option>
                                    {fields.map((field) => (
                                        <option key={field.key} value={field.key}>
                                            {field.label}
                                        </option>
                                    ))}
                                </select>
                                {filter.field && (
                                    <>
                                        <select
                                            value={filter.operator}
                                            onChange={(e) => updateFilter(index, "operator", e.target.value)}
                                            className={styles.filterSelect}
                                        >
                                            <option value="">اپراتور</option>
                                            {getOperators(fields.find((f) => f.key === filter.field)?.type).map((op) => (
                                                <option key={op.value} value={op.value}>
                                                    {op.label}
                                                </option>
                                            ))}
                                        </select>
                                        {filter.operator && (
                                            <>
                                                {fields.find((f) => f.key === filter.field)?.type === "select" ? (
                                                    <select
                                                        value={filter.value}
                                                        onChange={(e) => updateFilter(index, "value", e.target.value)}
                                                        className={styles.filterSelect}
                                                    >
                                                        <option value="">مقدار</option>
                                                        {fields
                                                            .find((f) => f.key === filter.field)
                                                            ?.options.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {filter.field === "status_id" ? getStatusText(opt.label) : opt.label}
                                                                </option>
                                                            ))}
                                                    </select>
                                                ) : fields.find((f) => f.key === filter.field)?.type === "date" ? (
                                                    <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
                                                        <DatePicker
                                                            value={filter.value ? moment(filter.value, "YYYY-MM-DD") : null}
                                                            onChange={(newValue) =>
                                                                updateFilter(index, "value", newValue ? newValue.format("YYYY-MM-DD") : "")
                                                            }
                                                            renderInput={(params) => (
                                                                <input {...params} className={styles.filterInput} placeholder="تاریخ (جدید)" />
                                                            )}
                                                        />
                                                    </LocalizationProvider>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={filter.value}
                                                        onChange={(e) => updateFilter(index, "value", e.target.value)}
                                                        className={styles.filterInput}
                                                        placeholder="مقدار"
                                                    />
                                                )}
                                                {filter.operator === "between" && (
                                                    <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
                                                        <DatePicker
                                                            value={filter.value2 ? moment(filter.value2, "YYYY-MM-DD") : null}
                                                            onChange={(newValue) =>
                                                                updateFilter(index, "value2", newValue ? newValue.format("YYYY-MM-DD") : "")
                                                            }
                                                            renderInput={(params) => (
                                                                <input {...params} className={styles.filterInput} placeholder="تا تاریخ (جدید)" />
                                                            )}
                                                        />
                                                    </LocalizationProvider>
                                                )}
                                            </>
                                        )}
                                        <button onClick={() => removeFilter(index)} className={styles.removeFilterBtn} title="حذف فیلتر">
                                            <FaTrash />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                        <div className={styles.actions}>
                            <button onClick={addFilter} className={styles.addFilterBtn}>
                                <FaPlus /> افزودن شرط جدید
                            </button>
                            <button
                                onClick={runQuery}
                                className={styles.runQueryBtn}
                                disabled={loading || !filters.some((f) => f.field && f.operator && f.value)}
                            >
                                <FaPlay /> {loading ? "در حال اجرا..." : "اجرای گزارش"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {results.length > 0 && (
                <div className={styles.resultsSection}>
                    <h3>نتایج گزارش</h3>
                    <div className={styles.printActions}>
                        <button onClick={handlePrint} className={styles.printBtn}>
                            <FaPrint /> چاپ گزارش
                        </button>
                    </div>
                    {renderDynamicTable()}
                </div>
            )}
        </div>
    );
};

export default ReportBuilder;