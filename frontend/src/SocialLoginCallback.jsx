import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const SocialLoginCallback = ({ onAuth }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract user data and token from URL
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    const token = params.get('token');

    if (user && token) {
      try {
        // Parse user data and save to local storage or state
        const userData = JSON.parse(decodeURIComponent(user));
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);

        // Call the onAuth prop to update the app's auth state
        onAuth(userData, token);

        // Redirect to the chats page
        console.log('About to navigate to /chats');
        window.location.href = '/chats';
        console.log('Navigated to /chats');
      } catch (err) {
        console.error('Failed to parse user from social login callback:', err);
        navigate('/auth/login');
      }
    } else {
      // Handle error or redirect to login
      navigate('/auth/login');
    }
  }, [navigate, onAuth]);

  return <div>Loading...</div>;
};

SocialLoginCallback.propTypes = {
  onAuth: PropTypes.func.isRequired,
};

export default SocialLoginCallback; 