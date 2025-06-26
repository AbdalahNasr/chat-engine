import './EditProfilePage.scss';
import axios from 'axios';
import { FaCamera, FaArrowLeft, FaKey } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const API_BASE = 'http://localhost:3001/api';

const EditProfilePage = ({ user, setUser }) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', profileImage: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [secondaryEmails, setSecondaryEmails] = useState([]);
  const [newSecondaryEmail, setNewSecondaryEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const fileInputRef = useRef();
  const [usernameInput, setUsernameInput] = useState('');
  const navigate = useNavigate();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
        if (err.response && err.response.status === 404) {
          console.error('404 Not Found: User profile does not exist.');
        }
        setFormError('Failed to load profile.');
      }
    };
    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle avatar file change
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

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    console.log('Submitting profile update. avatarFile =', avatarFile);
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
      setUser(res.data);
      setAvatarFile(null);
      setAvatarPreview(res.data.profileImage || avatarPreview);
      setUsernameInput(res.data.username || '');
      setTimeout(() => navigate('/chats'), 1200); // Redirect after short delay
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.error('404 Not Found: User profile does not exist.');
      }
      setFormError(err.response?.data?.msg || 'Failed to update profile.');
    }
  };

  // Handle add secondary email
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

  // Handle promote secondary email
  const handlePromoteEmail = async (email) => {
    setFormError('');
    setFormSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_BASE}/users/me/promote-email`, { email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setFormSuccess('Email promoted to primary!');
    } catch (err) {
      setFormError(err.response?.data?.msg || 'Failed to promote email.');
    }
  };

  // Handle delete secondary email
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

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-card">
        <button className="back-arrow" onClick={() => navigate('/chats')} title="Back to Chats">
          <FaArrowLeft />
        </button>
        <h2>Edit Profile</h2>
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
        <button className="change-password-btn" onClick={() => navigate('/change-password')} title="Change Password">
          <FaKey style={{ marginRight: 8 }} /> Change Password
        </button>
      </div>
    </div>
  );
};

EditProfilePage.propTypes = {
  user: PropTypes.object.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default EditProfilePage;