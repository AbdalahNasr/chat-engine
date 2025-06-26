import { FaUser, FaKey, FaTrash, FaCamera } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SettingsPage.scss';

const API_BASE = 'http://localhost:3001/api';

const settingsOptions = [
  { key: 'profile', label: 'Profile', icon: <FaUser /> },
  { key: 'password', label: 'Change Password', icon: <FaKey /> },
  { key: 'delete', label: 'Delete Account', icon: <FaTrash /> },
];

export default function SettingsPage({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = location.pathname.split('/').pop() || 'profile';

  // Profile form state
  const [userLocal, setUserLocal] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', profileImage: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [secondaryEmails, setSecondaryEmails] = useState([]);
  const [newSecondaryEmail, setNewSecondaryEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const fileInputRef = useRef();
  const [usernameInput, setUsernameInput] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  // Fetch user profile on mount
  useEffect(() => {
    if (current !== 'profile') return;
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserLocal(res.data);
        setForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          phone: res.data.phone || '',
          profileImage: res.data.profileImage || '',
        });
        setSecondaryEmails(res.data.secondaryEmails || []);
        setAvatarPreview(res.data.profileImage || null);
        setUsernameInput(res.data.username || '');
      } catch (err) {
        setFormError('Failed to load profile.');
      }
    };
    fetchProfile();
  }, [current]);

  // Handlers for profile form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleUsernameChange = (e) => {
    setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_\-.]/g, ''));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('phone', form.phone);
      if (avatarFile) formData.append('avatar', avatarFile);
      formData.append('username', usernameInput);
      const res = await axios.put(`${API_BASE}/users/me`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormSuccess('Profile updated successfully!');
      setUserLocal(res.data);
      if (setUser) setUser(res.data);
      setAvatarFile(null);
      setAvatarPreview(res.data.profileImage || avatarPreview);
      setUsernameInput(res.data.username || '');
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to update profile.');
    }
  };
  // Secondary email handlers
  const handleAddSecondaryEmail = async () => {
    setFormError('');
    setFormSuccess('');
    if (!newSecondaryEmail) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/users/me/secondary-email`, { email: newSecondaryEmail }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSecondaryEmails(res.data.secondaryEmails);
      setNewSecondaryEmail('');
      setFormSuccess('Secondary email added!');
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to add secondary email.');
    }
  };
  const handlePromoteEmail = async (email) => {
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE}/users/me/promote-email`, { email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserLocal(res.data);
      setFormSuccess('Email promoted to primary!');
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to promote email.');
    }
  };
  const handleDeleteEmail = async (email) => {
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_BASE}/users/me/secondary-email`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { email },
      });
      setSecondaryEmails(res.data.secondaryEmails);
      setFormSuccess('Secondary email deleted.');
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to delete secondary email.');
    }
  };

  // Password handlers
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE}/users/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.msg || 'Failed to change password.');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    setDeleteSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteSuccess('Account deleted. Redirecting...');
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      setDeleteError(err.response?.data?.msg || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <h2 className="settings-title">Settings</h2>
        <ul className="settings-nav">
          {settingsOptions.map(opt => (
            <li
              key={opt.key}
              className={current === opt.key ? 'active' : ''}
              onClick={() => navigate(`/settings/${opt.key}`)}
            >
              <span className="icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </li>
          ))}
        </ul>
      </aside>
      <main className="settings-content">
        {current === 'profile' && (
          <div className="settings-section">
            <h3>Edit Profile</h3>
            {!userLocal ? (
              <span className="loader"></span>
            ) : (
              <>
                <div className="avatar-section">
                  <div className="avatar-wrapper" onClick={handleAvatarClick} title="Change profile image">
                    <img
                      src={avatarPreview || '/default-avatar.png'}
                      alt="Avatar Preview"
                      className="profile-avatar"
                    />
                    <span className="avatar-edit-icon"><FaCamera /></span>
                    <span className="avatar-change-text">Change Photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </div>
                <form className="edit-profile-form" onSubmit={handleSubmit}>
                  <label>
                    Username
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={handleUsernameChange}
                        style={{ flex: 1 }}
                        maxLength={32}
                        autoComplete="off"
                      />
                      <span style={{ color: '#7a8bbd', fontWeight: 600, fontSize: '1.1em' }}>
                        {user.discriminator ? `#${user.discriminator}` : ''}
                      </span>
                    </div>
                  </label>
                  <label>
                    Email
                    <input type="email" value={user.email} readOnly />
                  </label>
                  <label>
                    First Name
                    <input type="text" name="first_name" value={form.first_name} onChange={handleChange} />
                  </label>
                  <label>
                    Last Name
                    <input type="text" name="last_name" value={form.last_name} onChange={handleChange} />
                  </label>
                  <label>
                    Phone
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
                  </label>
                  <div className="email-section">
                    <label>Secondary Emails</label>
                    {secondaryEmails.length === 0 && <div style={{ color: '#7a8bbd', fontSize: '0.98em' }}>No secondary emails.</div>}
                    {secondaryEmails.map((email) => (
                      <div key={email} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="email" value={email} readOnly style={{ flex: 1 }} />
                        <button type="button" onClick={() => handlePromoteEmail(email)} title="Promote to primary" style={{ marginRight: 4 }}>Promote</button>
                        <button type="button" onClick={() => handleDeleteEmail(email)} title="Delete">Delete</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        type="email"
                        placeholder="Add new secondary email"
                        value={newSecondaryEmail}
                        onChange={e => setNewSecondaryEmail(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={handleAddSecondaryEmail}>Add Secondary Email</button>
                    </div>
                  </div>
                  {formError && <div className="form-error">{formError}</div>}
                  {formSuccess && <div className="form-success">{formSuccess}</div>}
                  <button className="save-btn" type="submit">Save Changes</button>
                </form>
              </>
            )}
          </div>
        )}
        {current === 'password' && (
          <div className="flex flex-col items-center justify-center min-h-screen w-full">
            <div className="bg-[#232b3e] rounded-2xl shadow-xl p-10 w-full max-w-xl flex flex-col items-center">
              <h3 className="text-2xl font-bold text-center text-white mb-8">Change Password</h3>
              <form className="w-full flex flex-col gap-6" onSubmit={handlePasswordSubmit}>
                <label className="w-full text-white">
                  Current Password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="mt-2 w-full rounded-lg bg-[#181e2a] border border-[#407bff] text-white px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#407bff]"
                  />
                </label>
                <label className="w-full text-white">
                  New Password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-lg bg-[#181e2a] border border-[#407bff] text-white px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#407bff]"
                  />
                </label>
                <label className="w-full text-white">
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-lg bg-[#181e2a] border border-[#407bff] text-white px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#407bff]"
                  />
                </label>
                {pwError && <div className="text-red-400 bg-red-900/40 rounded-lg px-4 py-2 text-center">{pwError}</div>}
                {pwSuccess && <div className="text-cyan-400 bg-cyan-900/40 rounded-lg px-4 py-2 text-center">{pwSuccess}</div>}
                <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-[#407bff] to-[#00cfff] text-white text-xl font-bold shadow-lg hover:from-[#00cfff] hover:to-[#407bff] transition-all">Save Password</button>
              </form>
            </div>
          </div>
        )}
        {current === 'delete' && (
          <div className="settings-section delete-section">
            <span className="delete-warning-icon"><FaTrash /></span>
            <div className="delete-warning-text">
              Warning: This action is irreversible. All your data will be permanently deleted.
            </div>
            <button
              className="delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              <FaTrash /> Delete My Account
            </button>
            {deleteError && <div className="form-error">{deleteError}</div>}
            {deleteSuccess && <div className="form-success">{deleteSuccess}</div>}
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
          </div>
        )}
      </main>
    </div>
  );
}

SettingsPage.propTypes = {
  user: PropTypes.object.isRequired,
  setUser: PropTypes.func.isRequired,
};