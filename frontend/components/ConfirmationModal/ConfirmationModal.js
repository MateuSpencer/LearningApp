import React from 'react';
import PropTypes from 'prop-types';
import styles from './ConfirmationModal.module.css';

/**
 * A reusable confirmation modal component that matches the site's styling
 */
const ConfirmationModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;
  
  // Close modal when clicking outside (on the backdrop)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.content}>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.actions}>
          <button 
            onClick={onCancel} 
            className={`${styles.button} ${styles.cancelButton}`}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`${styles.button} ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string
};

export default ConfirmationModal;