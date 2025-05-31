import React from 'react';
import styles from './Campaigns.module.css';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>{title}</h3>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className={styles.modalContent}>{children}</div>
                <div className={styles.modalFooter}>
                    <button className={styles.modalCloseFooterBtn} onClick={onClose}>
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;