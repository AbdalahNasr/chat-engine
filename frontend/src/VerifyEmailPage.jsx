import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AuthPage.scss';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    fetch(`http://localhost:3001/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.msg && data.msg.toLowerCase().includes('success')) {
          setStatus('success');
          setMessage('Your email has been verified! You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.msg || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verification failed.');
      });
  }, [searchParams]);

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Email Verification</h2>
        <div className={status === 'success' ? 'form-success' : 'form-error'} style={{marginBottom: 24}}>{message}</div>
        <button onClick={() => navigate('/')} style={{marginTop: 12}}>Go to Login</button>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 