import { useState } from 'react';
import axios from 'axios';
import './AuthPage.scss';
import PropTypes from 'prop-types';
import { FaGoogle, FaFacebookF, FaApple, FaGithub, FaMicrosoft } from 'react-icons/fa';

const AuthPage = (props) => {
  const [isLogin, setIsLogin] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const onAuth = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const url = isLogin ? 'http://localhost:3001/api/auth/login' : 'http://localhost:3001/api/auth/register';
    
    // For login, we send JSON. For register, we send FormData to handle the file upload.
    const requestData = isLogin ? Object.fromEntries(formData.entries()) : formData;
    const headers = isLogin ? { 'Content-Type': 'application/json' } : {};

    axios.post(url, requestData, { headers })
      .then(r => {
        props.onAuth(r.data);
      })
      .catch(err => {
        console.error("Authentication error:", err);
        alert('Authentication failed. Please check your credentials.');
      });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={onAuth} autoComplete="off">
          <div className="input-box">
            <input type="text" name="username" required placeholder=" " />
            <label>Username</label>
          </div>
          <div className="input-box">
            <input type="password" name="password" required placeholder=" " />
            <label>Password</label>
          </div>
          {!isLogin && (
            <>
              <div className="input-box">
                <input type="text" name="first_name" required placeholder=" " />
                <label>First Name</label>
              </div>
              <div className="input-box">
                <input type="text" name="last_name" required placeholder=" " />
                <label>Last Name</label>
              </div>
              <div className="input-box">
                <input type="email" name="email" required placeholder=" " />
                <label>Email</label>
              </div>
              <div className="file-input-box">
                <label>Profile Picture</label>
                <div className="file-input-area">
                  {avatarPreview && <img src={avatarPreview} alt="Avatar Preview" className="avatar-preview" />}
                  <input type="file" name="avatar" accept="image/*" onChange={handleAvatarChange} />
                </div>
              </div>
            </>
          )}

          <button type="submit">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
          {/* Social Login Buttons */}
          <div className="social-login-section">
            <button type="button" className="social-btn google" onClick={() => alert('Google login coming soon!')}><FaGoogle className="social-icon" />Sign in with Google</button>
            <button type="button" className="social-btn facebook" onClick={() => alert('Facebook login coming soon!')}><FaFacebookF className="social-icon" />Sign in with Facebook</button>
            <button type="button" className="social-btn apple" onClick={() => alert('Apple login coming soon!')}><FaApple className="social-icon" />Sign in with Apple</button>
            <button type="button" className="social-btn github" onClick={() => alert('GitHub login coming soon!')}><FaGithub className="social-icon" />Sign in with GitHub</button>
            <button type="button" className="social-btn microsoft" onClick={() => alert('Microsoft login coming soon!')}><FaMicrosoft className="social-icon" />Sign in with Microsoft</button>
          </div>
          <div className="divider"><span>or</span></div>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <a href="#" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign Up' : 'Login'}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

AuthPage.propTypes = {
  onAuth: PropTypes.func.isRequired
};

export default AuthPage;