import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaCircle, FaMoon, FaMinusCircle } from 'react-icons/fa';
import { IoExitOutline } from 'react-icons/io5';

const defaultAvatar = 'https://icon-library.com/images/default-user-icon/default-user-icon-13.jpg';

const UserProfile = ({ user, onStatusChange }) => {
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  const statuses = {
    online: { icon: <FaCircle />, text: 'Online' },
    idle: { icon: <FaMoon />, text: 'Idle' },
    dnd: { icon: <FaMinusCircle />, text: 'Do Not Disturb' },
    offline: { icon: <IoExitOutline />, text: 'Invisible' },
  };

  const handleStatusSelect = (status) => {
    onStatusChange(status);
    setIsStatusPickerOpen(false);
  };

  const currentStatus = user.status || 'online';

  return (
    <div className="user-profile-container">
      {isStatusPickerOpen && (
        <div className="status-picker-overlay" onClick={() => setIsStatusPickerOpen(false)}>
          <div className="status-picker" onClick={(e) => e.stopPropagation()}>
            <div className="status-picker-header">
              <img src={user.profileImage || defaultAvatar} alt="My Avatar" className="avatar" />
              <div className="username">{user.username}</div>
              <div className="current-status-text">You are currently {statuses[currentStatus].text}</div>
            </div>
            <ul>
              {Object.entries(statuses).map(([statusKey, { icon, text }]) => (
                <li key={statusKey} onClick={() => handleStatusSelect(statusKey)}>
                  {icon}
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="user-profile-card" onClick={() => setIsStatusPickerOpen(true)}>
        <div className="avatar-wrapper">
          <img src={user.profileImage || defaultAvatar} alt="My Avatar" className="avatar" />
          <div className={`status-indicator-mini ${currentStatus}`}></div>
        </div>
        <div className="user-details">
          <div className="username">{user.username}</div>
          <div className="status-text">{statuses[currentStatus].text}</div>
        </div>
      </div>
    </div>
  );
};

UserProfile.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    profileImage: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default UserProfile; 