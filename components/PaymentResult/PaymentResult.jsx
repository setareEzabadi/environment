import styles from "./PaymentResult.module.css";
import Layout from "../layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PaymentResult = () => {
    const router = useRouter();
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [trackId, setTrackId] = useState(null);

    useEffect(() => {
        const { success, status, trackId } = router.query;
        // Assuming success=1 and status=2 indicate a successful payment
        // Adjust the condition based on your actual backend logic
        if (success && status && trackId) {
            setPaymentStatus(success === "1" && status === "2" ? "success" : "failure");
            setTrackId(trackId);
        }
    }, [router.query]);

    return (
        <div className={styles.paymentResult}>
            {paymentStatus === "success" ? (
                <div className={styles.resultContainer}>
                    <h3 className={styles.resultTitle}>پرداخت موفق</h3>
                    <p className={styles.resultMessage}>
                        پرداخت شما با موفقیت انجام شد.
                    </p>
                    <p className={styles.resultDetails}>
                        کد پیگیری: <span className={styles.trackId}>{trackId}</span>
                    </p>
                    <button
                        className={styles.actionBtn}
                        onClick={() => router.push("/")}
                    >
                        بازگشت به صفحه اصلی
                    </button>
                </div>
            ) : paymentStatus === "failure" ? (
                <div className={styles.resultContainer}>
                    <h3 className={styles.resultTitle}>پرداخت ناموفق</h3>
                    <p className={styles.resultMessage}>
                        متأسفانه پرداخت شما ناموفق بود. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.
                    </p>
                    <p className={styles.resultDetails}>
                        کد پیگیری: <span className={styles.trackId}>{trackId}</span>
                    </p>
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => router.push("/payment/retry")}
                        >
                            تلاش مجدد
                        </button>
                        <button
                            className={styles.actionBtn + " " + styles.supportBtn}
                            onClick={() => router.push("/support")}
                        >
                            تماس با پشتیبانی
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.resultContainer}>
                    <p className={styles.resultMessage}>در حال بررسی وضعیت پرداخت...</p>
                </div>
            )}
        </div>
    );
};

export default PaymentResult;