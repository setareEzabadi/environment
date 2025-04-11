import React, { useRef } from "react";
import styles from "./OtpInput.module.css";

const OtpInput = ({ value, onChange, length = 6 }) => {
    const inputs = useRef([]);

    const handleChange = (e, i) => {
        const val = e.target.value;
        if (!/^[0-9]?$/.test(val)) return;

        const newOtp = value.split("");
        newOtp[i] = val;
        onChange(newOtp.join(""));

        if (val && i < length - 1) {
            inputs.current[i + 1].focus();
        }
    };

    const handleKeyDown = (e, i) => {
        if (e.key === "Backspace" && !value[i] && i > 0) {
            inputs.current[i - 1].focus();
        }
    };

    return (
        <div className={styles.otpWrapper}>
            {Array(length)
                .fill(0)
                .map((_, i) => (
                    <input
                        key={i}
                        ref={(el) => (inputs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        className={`${styles.otpInput} ${value[i] ? styles.filled : ""}`}
                        value={value[i] || ""}
                        onChange={(e) => handleChange(e, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                    />
                ))}
        </div>
    );
};

export default OtpInput;
