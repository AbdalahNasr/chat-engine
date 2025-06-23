import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import AuthPage from "./AuthPage";
import ChatsPage from "./ChatsPage";
import VerifyEmailPage from "./VerifyEmailPage";
import ResetPasswordPage from "./ResetPasswordPage";
import SocialLoginCallback from "./SocialLoginCallback";

function App() {
  // Initialize user state from localStorage to persist session
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : undefined;
  });

  // Create a single auth handler to manage state and localStorage
  const handleAuth = (authedUser) => {
    setUser(authedUser);
    if (authedUser) {
      localStorage.setItem('user', JSON.stringify(authedUser));
    } else {
      // Clear user from localStorage on logout
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/chats" element={user ? <ChatsPage user={user} onLogout={() => handleAuth(undefined)} /> : <AuthPage onAuth={handleAuth} />} />
        <Route path="/callback" element={<SocialLoginCallback onAuth={handleAuth} />} />
        <Route path="/" element={user ? <ChatsPage user={user} onLogout={() => handleAuth(undefined)} /> : <AuthPage onAuth={handleAuth} />} />
      </Routes>
    </Router>
  );
}

export default App;