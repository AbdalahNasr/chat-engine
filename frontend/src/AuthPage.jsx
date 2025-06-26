import { useState } from 'react';
import axios from 'axios';
import './AuthPage.scss';
import PropTypes from 'prop-types';
import { FaGoogle, FaFacebookF,  FaGithub } from 'react-icons/fa';
import ResetPasswordPage from './ResetPasswordPage';
import { useNavigate } from 'react-router-dom';

// Forgot Password UI
const ForgotPasswordForm = ({ onBack, onOtp }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:3001/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error sending reset email.');
    }
  };

  return (
    <div className="login-box">
      <h2>Forgot Password</h2>
      {sent ? (
        <>
          <div className="form-success">Reset email sent! Please check your inbox.</div>
          <button style={{marginTop: 18}} onClick={() => onOtp(email)}>Enter code manually</button>
        </>
      ) : (
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="input-box">
            <input type="email" name="email" required placeholder=" " value={email} onChange={e => setEmail(e.target.value)} />
            <label>Email</label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit">Send Reset Email</button>
          <p className="auth-toggle"><a href="#" onClick={onBack}>Back to Login</a></p>
        </form>
      )}
    </div>
  );
};

ForgotPasswordForm.propTypes = { onBack: PropTypes.func.isRequired, onOtp: PropTypes.func.isRequired };

const AuthPage = (props) => {
  const [isLogin, setIsLogin] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showForgot, setShowForgot] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const onAuth = (e) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    const formData = new FormData(e.target);
    
    const url = isLogin ? 'http://localhost:3001/api/auth/login' : 'http://localhost:3001/api/auth/register';
    
    // For login, we send JSON. For register, we send FormData to handle the file upload.
    const requestData = isLogin ? Object.fromEntries(formData.entries()) : formData;
    const headers = isLogin ? { 'Content-Type': 'application/json' } : {};

    axios.post(url, requestData, { headers })
      .then(r => {
        if (!isLogin) {
          setSuccessMsg(r.data.msg || 'Registration successful! You can now log in.');
          setTimeout(() => {
            setIsLogin(true);
            setSuccessMsg('');
            navigate('/auth/login');
          }, 2000);
        } else {
          props.onAuth(r.data.user, r.data.token);
          navigate('/chats');
        }
      })
      .catch(err => {
        console.error("Authentication error:", err);
        if (err.response && err.response.status === 400 && err.response.data && err.response.data.msg) {
          const msg = err.response.data.msg;
          if (isLogin && msg.toLowerCase().includes("invalid credentials")) {
            setFormErrors({ password: 'Wrong email or password' });
          } else if (msg.toLowerCase().includes("previously deleted")) {
            setFormErrors({ email: msg });
          } else if (msg.toLowerCase().includes("username")) {
            setFormErrors({ username: msg });
          } else if (msg.toLowerCase().includes("email")) {
            setFormErrors({ email: msg });
          } else if (msg.toLowerCase().includes("password")) {
            setFormErrors({ password: msg });
          } else if (msg.toLowerCase().includes("phone")) {
            setFormErrors({ phone: msg });
          } else if (msg.toLowerCase().includes("first name")) {
            setFormErrors({ first_name: msg });
          } else if (msg.toLowerCase().includes("last name")) {
            setFormErrors({ last_name: msg });
          } else if (msg.toLowerCase().includes("avatar")) {
            setFormErrors({ avatar: msg });
          } else {
            setFormErrors({}); // No error shown if not field-specific
          }
        } else {
          setFormErrors({});
        }
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

  if (showOtp) {
    return <ResetPasswordPage email={resetEmail} />;
  }

  if (showForgot) {
    return (
      <div className="login-page">
        <ForgotPasswordForm 
          onBack={() => setShowForgot(false)} 
          onOtp={(email) => { 
            setResetEmail(email); 
            setShowOtp(true); 
          }} 
        />
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {successMsg && <div className="form-success">{successMsg}</div>}
        <form onSubmit={onAuth} autoComplete="off">
          <div className="input-box">
            <input type="text" name="username" required placeholder=" " />
            <label>Username</label>
          </div>
          {formErrors.username && <div className="form-error">{formErrors.username}</div>}
          <div className="input-box">
            <input type="password" name="password" required placeholder=" " />
            <label>Password</label>
          </div>
          {formErrors.password && <div className="form-error">{formErrors.password}</div>}
          {!isLogin && (
            <>
              <div className="input-box">
                <input type="text" name="first_name" required placeholder=" " />
                <label>First Name</label>
              </div>
              {formErrors.first_name && <div className="form-error">{formErrors.first_name}</div>}
              <div className="input-box">
                <input type="text" name="last_name" required placeholder=" " />
                <label>Last Name</label>
              </div>
              {formErrors.last_name && <div className="form-error">{formErrors.last_name}</div>}
              <div className="input-box">
                <input type="email" name="email" required placeholder=" " />
                <label>Email</label>
              </div>
              {formErrors.email && <div className="form-error">{formErrors.email}</div>}
              <div className="input-box">
                <input type="tel" name="phone" required placeholder=" " />
                <label>Phone Number</label>
              </div>
              {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
              <div className="file-input-box">
                <label>Profile Picture</label>
                <div className="file-input-area">
                  {avatarPreview && <img src={avatarPreview} alt="Avatar Preview" className="avatar-preview" />}
                  <input type="file" name="avatar" accept="image/*" onChange={handleAvatarChange} />
                </div>
              </div>
              {formErrors.avatar && <div className="form-error">{formErrors.avatar}</div>}
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
            <button type="button" className="social-btn google" onClick={() => window.location.href='http://localhost:3001/api/auth/google'}><FaGoogle className="social-icon" />Sign in with Google</button>
            <button type="button" className="social-btn facebook" onClick={() => window.location.href='http://localhost:3001/api/auth/facebook'}><FaFacebookF className="social-icon" />Sign in with Facebook</button>
            <button type="button" className="social-btn github" onClick={() => window.location.href='http://localhost:3001/api/auth/github'}><FaGithub className="social-icon" />Sign in with GitHub</button>
          </div>
          <div className="divider"><span>or</span></div>

          <p className="auth-toggle">
            {isLogin ? (
              <>
                Don&apos;t have an account?
                <a href="#" onClick={() => setIsLogin(false)}>Sign Up</a>
                <br />
                <a href="#" onClick={() => setShowForgot(true)} style={{ color: '#ff4d4f', fontSize: '0.98em' }}>Forgot Password?</a>
              </>
            ) : (
              <>
                Already have an account?
                <a href="#" onClick={() => setIsLogin(true)}>Login</a>
              </>
            )}
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