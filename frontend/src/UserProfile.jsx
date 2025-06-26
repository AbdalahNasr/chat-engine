import PropTypes from 'prop-types';
import { FaCircle, FaMoon, FaMinusCircle } from 'react-icons/fa';
import { IoExitOutline } from 'react-icons/io5';
import { useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';

const defaultAvatar = 'https://icon-library.com/images/default-user-icon/default-user-icon-13.jpg';

const UserProfile = ({ user, onStatusChange, onLogout }) => {
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (onLogout) onLogout();
        navigate('/auth');
      } else {
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

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

      <button
        className="edit-profile-btn"
        onClick={() => navigate('/profile/edit')}
        type="button"
      >
        Edit Profile
      </button>

      <button
        className="delete-account-btn"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={deleting}
        type="button"
      >
        Delete Account
      </button>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-title">Delete Account?</div>
            <div className="delete-confirm-text">This action cannot be undone. Are you sure?</div>
            <div className="delete-confirm-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
              <button className="confirm-btn" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal removed, now handled by /profile/edit page */}
    </div>
  );
};

UserProfile.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    profileImage: PropTypes.string,
    status: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onLogout: PropTypes.func, // Optional, for logging out after delete
};

export default UserProfile;