import React, { useState } from 'react';
import PropTypes from 'prop-types';
import s from './DeleteAccountButton.module.css';

const DeleteAccountButton = ({ onDeleteAccount, isLoading }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  
  const handleInitiateDelete = () => {
    setShowConfirmation(true);
  };
  
  const handleCancelDelete = () => {
    setShowConfirmation(false);
    setConfirmation('');
  };
  
  const handleConfirmationChange = (e) => {
    setConfirmation(e.target.value);
  };
  
  const handleConfirmDelete = (e) => {
    e.preventDefault();
    if (confirmation.toLowerCase() === 'delete') {
      onDeleteAccount();
    }
  };
  
  if (!showConfirmation) {
    return (
      <button 
        className={s.DeleteButton} 
        onClick={handleInitiateDelete}
        disabled={isLoading}
        type="button"
      >
        Delete Account
      </button>
    );
  }
  
  return (
    <div className={s.ConfirmationContainer}>
      <div className={s.ConfirmationMessage}>
        <h3 className={s.ConfirmationTitle}>Delete Your Account?</h3>
        <p className={s.ConfirmationText}>
          This action is permanent and cannot be undone. All your data will be permanently deleted.
        </p>
        <p className={s.ConfirmationInstruction}>
          Type <strong>delete</strong> to confirm:
        </p>
        <form onSubmit={handleConfirmDelete}>
          <input
            type="text"
            className={s.ConfirmationInput}
            value={confirmation}
            onChange={handleConfirmationChange}
            placeholder="delete"
            disabled={isLoading}
          />
          <div className={s.ButtonGroup}>
            <button
              type="button"
              className={s.CancelButton}
              onClick={handleCancelDelete}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={s.ConfirmButton}
              disabled={confirmation.toLowerCase() !== 'delete' || isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

DeleteAccountButton.propTypes = {
  onDeleteAccount: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

DeleteAccountButton.defaultProps = {
  isLoading: false
};

export default DeleteAccountButton;