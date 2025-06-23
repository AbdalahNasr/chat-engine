import { useState } from 'react';
import './AuthPage.scss';
import PropTypes from 'prop-types';

const OTPInput = ({ value, onChange, length = 6 }) => {
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (paste.length === length) {
      onChange(paste);
      e.preventDefault();
    }
  };
  const inputs = [];
  for (let i = 0; i < length; i++) {
    inputs.push(
      <input
        key={i}
        className="otp-input"
        type="text"
        maxLength={1}
        value={value[i] || ''}
        onChange={e => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          const newValue = value.split('');
          if (val) {
            newValue[i] = val;
            onChange(newValue.join('').slice(0, length));
            // Move to next input
            const next = document.getElementById(`otp-input-${i+1}`);
            if (next) next.focus();
          } else {
            // If input is cleared, clear this digit
            newValue[i] = '';
            onChange(newValue.join(''));
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Backspace') {
            const newValue = value.split('');
            if (value[i]) {
              // Clear current digit
              newValue[i] = '';
              onChange(newValue.join(''));
            } else if (i > 0) {
              // Move to previous input
              const prev = document.getElementById(`otp-input-${i-1}`);
              if (prev) prev.focus();
              newValue[i-1] = '';
              onChange(newValue.join(''));
            }
            e.preventDefault();
          }
        }}
        onPaste={handlePaste}
        id={`otp-input-${i}`}
        style={{letterSpacing: '2px'}}
      />
    );
  }
  return <div className="otp-inp">{inputs}</div>;
};

OTPInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  length: PropTypes.number
};

export const OTPForm = ({ onSuccess, email }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [resendStatus, setResendStatus] = useState('idle');

  const handleResend = async () => {
    if (!email) {
      setMessage('Email is missing. Please go back and enter your email.');
      setStatus('error');
      return;
    }
    setResendStatus('loading');
    try {
      await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setResendStatus('success');
      setTimeout(() => setResendStatus('idle'), 2000);
    } catch {
      setResendStatus('error');
      setTimeout(() => setResendStatus('idle'), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');
    if (!code || code.length !== 6) {
      setStatus('error');
      setMessage('Please enter the 6-digit code from your email.');
      return;
    }
    try {
      // Call the new verify-reset-code endpoint
      const res = await fetch('http://localhost:3001/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok && data.tempToken) {
        onSuccess(data.tempToken); // Pass tempToken to next step
      } else {
        setStatus('error');
        setMessage(data.msg || 'Invalid code.');
      }
    } catch {
      setStatus('error');
      setMessage('Invalid code.');
    }
  };

  return (
    <div className="login-page">
      <form className="otp-form" onSubmit={handleSubmit} autoComplete="off">
        <div className="otp-content">
          <p className="otp-title">OTP Verification</p>
          {email && <div className="otp-email">Code sent to: <b>{email}</b></div>}
          {!email && <div className="form-error">Email is missing. Please go back and enter your email.</div>}
          <OTPInput value={code} onChange={setCode} length={6} />
          {status === 'error' && <div className="form-error">{message}</div>}
          <button type="submit" className="otp-btn">Verify</button>
          <div className="otp-divider"><span>or</span></div>
          <div className="otp-links">
            <button type="button" className="otp-link" onClick={handleResend} disabled={!email}>
              {resendStatus === 'loading' ? 'Resending...' : resendStatus === 'success' ? 'Code sent!' : 'Resend code'}
            </button>
            <span className="otp-sep">|</span>
            <a href="/" className="otp-link">Back to Login</a>
          </div>
        </div>
        <svg className="otp-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#4073ff" d="M56.8,-23.9C61.7,-3.2,45.7,18.8,26.5,31.7C7.2,44.6,-15.2,48.2,-35.5,36.5C-55.8,24.7,-73.9,-2.6,-67.6,-25.2C-61.3,-47.7,-30.6,-65.6,-2.4,-64.8C25.9,-64.1,51.8,-44.7,56.8,-23.9Z" transform="translate(100 100)" className="otp-path"></path>
        </svg>
      </form>
    </div>
  );
};

OTPForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  email: PropTypes.string
};

export const ResetNewPasswordPage = ({ tempToken }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');
    if (!password || password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, newPassword: password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage('Password reset successful! You can now log in.');
        window.alert('Password reset successful! Please log in with your new password.');
        window.location.hash = '/';
      } else {
        setStatus('error');
        if (data.msg && data.msg.toLowerCase().includes('expired')) {
          setMessage('Your code has expired. Please request a new one.');
        } else if (data.msg && data.msg.toLowerCase().includes('invalid')) {
          setMessage('The code you entered is invalid. Please check your email or request a new code.');
        } else {
          setMessage(data.msg || 'Reset failed.');
        }
      }
    } catch {
      setStatus('error');
      setMessage('Reset failed.');
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h2>Password Reset</h2>
          <div className="form-success">{message}</div>
          <a href="/" className="otp-link">Back to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Set New Password</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="input-box">
            <input type="password" name="password" required placeholder=" " value={password} onChange={e => setPassword(e.target.value)} />
            <label>New Password</label>
          </div>
          <div className="input-box">
            <input type="password" name="confirm" required placeholder=" " value={confirm} onChange={e => setConfirm(e.target.value)} />
            <label>Confirm Password</label>
          </div>
          {status === 'error' && <div className="form-error">{message}</div>}
          <button type="submit" className="otp-btn">Set Password</button>
        </form>
      </div>
    </div>
  );
};

ResetNewPasswordPage.propTypes = {
  tempToken: PropTypes.string.isRequired
};

// Main page logic
const ResetPasswordPage = ({ email }) => {
  const [step, setStep] = useState('otp');
  const [tempToken, setTempToken] = useState('');

  if (step === 'otp') {
    return <OTPForm onSuccess={token => { setTempToken(token); setStep('reset'); }} email={email} />;
  }
  if (step === 'reset') {
    return <ResetNewPasswordPage tempToken={tempToken} />;
  }
  return null;
};

export default ResetPasswordPage; 