import { useState } from 'react';
import './EditProfilePage.scss';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api';

// Tailwind test banner - remove after confirming Tailwind works
const TailwindTestBanner = () => (
  <div className="bg-green-500 text-white text-center p-4 rounded shadow-lg mb-4">
    Tailwind CSS is working on the password settings page!
  </div>
);

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE}/users/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormSuccess('Password changed successfully!');
      setTimeout(() => navigate('/chats'), 1200);
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to change password.');
    }
  };

  return (
    <div className="edit-profile-page">
      <TailwindTestBanner />
      <div className="edit-profile-card">
        <button className="back-arrow" onClick={() => navigate('/profile/edit')} title="Back to Profile">
          <FaArrowLeft />
        </button>
        <h2 style={{ background: 'red', color: 'white' }}>Change Password</h2>
        <form className="edit-profile-form" onSubmit={handleSubmit}>
          <label>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          {formError && <div className="form-error">{formError}</div>}
          {formSuccess && <div className="form-success">{formSuccess}</div>}
          <button className="save-btn" type="submit">Save Password</button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;