import React from 'react';
import PropTypes from 'prop-types';
import s from './UserProfile.module.css';

const UserProfile = ({ user }) => {
  if (!user) return null;

  return (
    <div className={s.UserProfile}>
      <div className={s.Header}>
        <div className={s.Avatar}>
          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <h2 className={s.Username}>{user.username}</h2>
      </div>
      
      <div className={s.Details}>
        <div className={s.Field}>
          <span className={s.Label}>Email:</span>
          <span className={s.Value}>{user.email}</span>
        </div>
        
        {user.fullName && (
          <div className={s.Field}>
            <span className={s.Label}>Name:</span>
            <span className={s.Value}>{user.fullName}</span>
          </div>
        )}
        
        {user.dateJoined && (
          <div className={s.Field}>
            <span className={s.Label}>Member Since:</span>
            <span className={s.Value}>
              {new Date(user.dateJoined).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

UserProfile.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    fullName: PropTypes.string,
    dateJoined: PropTypes.string
  })
};

export default UserProfile;