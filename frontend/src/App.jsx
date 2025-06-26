import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import AuthPage from "./AuthPage";
import ChatsPage from "./ChatsPage";
import VerifyEmailPage from "./VerifyEmailPage";
import ResetPasswordPage from "./ResetPasswordPage";
import SocialLoginCallback from "./SocialLoginCallback";
import EditProfilePage from './EditProfilePage';
import ChangePasswordPage from './ChangePasswordPage';
import SettingsPage from './SettingsPage';
import TestTailwind from './TestTailwind';

// Tailwind test banner - remove after confirming Tailwind works
const TailwindTestBanner = () => (
  <div className="bg-blue-500 text-white text-center p-4 rounded shadow-lg mb-4">
    Tailwind CSS is working!
  </div>
);

function Root() {
  // Initialize user state from localStorage to persist session
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return (savedUser && token) ? JSON.parse(savedUser) : undefined;
  });

  // Create a single auth handler to manage state and localStorage
  const handleAuth = (authedUser, token) => {
    setUser(authedUser);
    if (authedUser && token) {
      localStorage.setItem('user', JSON.stringify(authedUser));
      localStorage.setItem('token', token);
    } else {
      // Clear user from localStorage on logout
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const token = localStorage.getItem('token');

  return (
    <div>
      <TestTailwind />
      <TailwindTestBanner />
    <Router>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/chats" element={user && token ? <ChatsPage user={user} onLogout={() => handleAuth(undefined, undefined)} /> : <Navigate to="/auth/login" />} />
        <Route path="/auth/login" element={<AuthPage onAuth={handleAuth} />} />
        <Route path="/callback" element={<SocialLoginCallback onAuth={handleAuth} />} />
        <Route path="/" element={user && token ? <Navigate to="/chats" /> : <Navigate to="/auth/login" />} />
        <Route path="/profile/edit" element={user && token ? <EditProfilePage user={user} setUser={setUser} /> : <Navigate to="/auth/login" />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/settings/*" element={user && token ? <SettingsPage user={user} setUser={setUser} /> : <Navigate to="/auth/login" />} />
      </Routes>
    </Router>
    </div>
  );
}

export default Root;