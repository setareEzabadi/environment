import { useState, useEffect } from "react";
import styles from "./DashboardKarbar.module.css";
import env from "../../env";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash } from "react-icons/fa";

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    // بررسی نقش کاربر
    useEffect(() => {
        const checkUserRole = async () => {
            const userData = localStorage.getItem("auth_user");
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    const isAdminUser = parsedUser.role && parsedUser.role.toLowerCase() === "admin";
                    setIsAdmin(isAdminUser);
                    if (!isAdminUser) {
                        setError("دسترسی غیرمجاز: فقط ادمین‌ها می‌توانند دسته‌بندی‌ها را مدیریت کنند.");
                        toast.error("دسترسی غیرمجاز");
                    }
                } catch (err) {
                    console.error("خطا در پارس داده کاربر:", err);
                    setIsAdmin(false);
                    setError("خطا در بارگذاری اطلاعات کاربر");
                    toast.error("خطا در بارگذاری اطلاعات کاربر");
                }
            } else {
                setIsAdmin(false);
                setError("دسترسی غیرمجاز: لطفاً وارد شوید.");
                toast.error("دسترسی غیرمجاز");
            }
        };
        checkUserRole();
    }, []);

    // تابع کمکی برای ارسال درخواست‌ها
    const sendRequest = async (url, method = "GET", body = null) => {
        const token = localStorage.getItem("auth_token");
        if (!token) throw new Error("توکن احراز هویت یافت نشد");

        const headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || `خطای HTTP! وضعیت: ${response.status}`);
        return result;
    };

    // دریافت دسته‌بندی‌ها
    const fetchCategories = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const result = await sendRequest(`${env.baseUrl}api/getCategories`);
            setCategories(Array.isArray(result.data) ? result.data : []);
            toast.success("دسته‌بندی‌ها با موفقیت دریافت شدند");
        } catch (err) {
            setError(err.message || "خطا در دریافت دسته‌بندی‌ها");
            toast.error(err.message || "خطا در دریافت دسته‌بندی‌ها");
        } finally {
            setLoading(false);
        }
    };

    // افزودن دسته‌بندی
    const addCategory = async () => {
        if (!isAdmin) {
            toast.error("دسترسی غیرمجاز");
            return;
        }
        if (!newCategory) {
            toast.error("نام دسته‌بندی را وارد کنید");
            return;
        }
        try {
            const result = await sendRequest(`${env.baseUrl}api/storeCategory`, "POST", {
                name: newCategory,
            });
            setCategories([...categories, { id: result.category.id, name: newCategory }]);
            setNewCategory("");
            toast.success("دسته‌بندی با موفقیت اضافه شد");
        } catch (err) {
            toast.error(err.message || "خطا در افزودن دسته‌بندی");
        }
    };

    // حذف دسته‌بندی
    const deleteCategory = async (categoryId) => {
        if (!isAdmin) {
            toast.error("دسترسی غیرمجاز");
            return;
        }
        try {
            const result = await sendRequest(`${env.baseUrl}api/deleteCategory`, "POST", {
                category_id: categoryId,
            });
            setCategories(categories.filter((cat) => cat.id !== categoryId));
            toast.success("دسته‌بندی با موفقیت حذف شد");
        } catch (err) {
            toast.error(err.message || "خطا در حذف دسته‌بندی");
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchCategories();
        }
    }, [isAdmin]);

    if (!isAdmin) {
        return (
            <div className={styles.getReports}>
                <ToastContainer rtl position="bottom-right" autoClose={3000} />
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.getReports}>
            <ToastContainer rtl position="bottom-right" autoClose={3000} />
            <div className={styles.header}>
                <h3>مدیریت دسته‌بندی‌ها</h3>
            </div>
            {error && <span className={styles.error}>{error}</span>}
            {loading ? (
                <div className={styles.loader}>در حال بارگذاری...</div>
            ) : (
                <section className={styles.categorySection}>
                    <div className={styles.categoryForm}>
                        <input
                            type="text"
                            placeholder="نام دسته‌بندی جدید"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button onClick={addCategory} className={styles.addCategoryBtn}>
                            افزودن
                        </button>
                    </div>
                    <ul className={styles.categoryList}>
                        {categories.map((cat) => (
                            <li key={cat.id}>
                                <span>{cat.name}</span>
                                <button onClick={() => deleteCategory(cat.id)} className={styles.deleteBtn}>
                                    <FaTrash />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default CategoryManagement;