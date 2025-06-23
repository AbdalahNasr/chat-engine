const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { nanoid } = require('nanoid');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Utility to send email. It no longer has its own template; it just sends the HTML it's given.
const sendMail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};

// Helper to generate 6-digit code
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.register = async (req, res) => {
  const { username, password, email, first_name, last_name } = req.body;

  try {
    // 1. Check if user or email already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'Username already exists' });
    }
    let emailUser = await User.findOne({ email });
    if (emailUser) {
        return res.status(400).json({ msg: 'An account with this email already exists' });
    }

    // 2. Create a new user instance
    user = new User({
      username,
      password,
      email,
      first_name,
      last_name,
      profileImage: req.body.profileImage || '', // From avatarUpload middleware
      isVerified: false,
    });

    // 3. Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save the user to the database
    await user.save();

    // 5. Send back user data (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;

    // Generate email verification token
    const emailVerificationToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    user.emailVerificationToken = emailVerificationToken;
    await user.save();

    // Send verification email with a new, beautiful template
    const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${emailVerificationToken}`;
    const verificationEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
          }
          .email-container { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            min-height: 100vh; 
            padding: 20px; 
            box-sizing: border-box;
          }
          .email-card {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(30px);
            border-radius: 28px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
            max-width: 500px;
            margin: 0 auto;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            padding: 50px 30px 40px;
            text-align: center;
          }
          .logo {
            width: 72px;
            height: 72px;
            background: rgba(255, 255, 255, 0.25);
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .logo svg { width: 36px; height: 36px; fill: white; }
          .app-name { color: white; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; text-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .content { padding: 50px 35px; text-align: center; }
          .title { color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; }
          .description { color: #64748b; font-size: 17px; line-height: 1.7; margin: 0 0 40px 0; }
          .verify-button {
            display: inline-block;
            padding: 18px 40px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            text-decoration: none;
            font-size: 18px;
            font-weight: 600;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 172, 193, 0.3);
            transition: all 0.3s ease;
          }
          .verify-button:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(0, 172, 193, 0.4); }
          .security-notice { color: #94a3b8; font-size: 15px; margin-top: 40px; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer-text { color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-card">
            <div class="header">
              <div class="logo">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
              </div>
              <h1 class="app-name">Chat App</h1>
            </div>
            <div class="content">
              <h2 class="title">Welcome! Please Verify Your Email</h2>
              <p class="description">Thank you for signing up! Please click the button below to confirm your email address and activate your account.</p>
              <a href="${verifyUrl}" class="verify-button">Verify Email Address</a>
              <p class="security-notice">If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer"><p class="footer-text">© ${new Date().getFullYear()} Chat App. All rights reserved.</p></div>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendMail(user.email, 'Verify your email for Chat App', verificationEmailHtml);

    res.status(201).json({ ...userResponse, msg: 'Verification email sent. Please check your inbox.' });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username, email, or phone
    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
        { phone: username }
      ]
    });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Send back user data on successful login (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json(userResponse);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Email verification endpoint
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, emailVerificationToken: token });
    if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    res.json({ msg: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(400).json({ msg: 'Invalid or expired token' });
  }
};

// Forgot password: send reset code
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'No account with that email.' });
    const resetCode = generateOTP();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 min
    await user.save();
    
    // Premium, modern email template with enhanced styling
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
          }
          .email-container { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #f5576c 60%, #4facfe 80%, #00f2fe 100%);
            min-height: 100vh; 
            padding: 20px; 
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          }
          .email-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 20s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(10px, -10px) rotate(1deg); }
            50% { transform: translate(-5px, 5px) rotate(-1deg); }
            75% { transform: translate(-10px, -5px) rotate(0.5deg); }
          }
          .email-card {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(30px);
            border-radius: 28px;
            box-shadow: 
              0 25px 80px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(255, 255, 255, 0.3);
            max-width: 500px;
            margin: 0 auto;
            overflow: hidden;
            position: relative;
            z-index: 1;
            transform: translateY(0);
            transition: transform 0.3s ease;
          }
          .email-card:hover {
            transform: translateY(-5px);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            padding: 50px 30px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
            animation: shimmer 3s ease-in-out infinite;
          }
          @keyframes shimmer {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          .logo {
            width: 72px;
            height: 72px;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .logo svg {
            width: 36px;
            height: 36px;
            fill: white;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }
          .app-name {
            color: white;
            font-size: 32px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -1px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          .content {
            padding: 50px 35px;
            text-align: center;
            background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
          }
          .title {
            color: #1a1a1a;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 20px 0;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .description {
            color: #64748b;
            font-size: 17px;
            line-height: 1.7;
            margin: 0 0 40px 0;
            max-width: 380px;
            margin-left: auto;
            margin-right: auto;
            font-weight: 400;
          }
          .code-container {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            padding: 30px;
            margin: 0 0 35px 0;
            position: relative;
            overflow: hidden;
            box-shadow: 
              0 4px 20px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
          }
          .code-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe);
            animation: rainbow 3s linear infinite;
          }
          @keyframes rainbow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
          .code-label {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 0 0 15px 0;
          }
          .reset-code {
            font-size: 36px;
            font-weight: 800;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
            color: #1e293b;
            letter-spacing: 10px;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          .expiry-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            border-radius: 16px;
            padding: 20px;
            margin: 0 0 35px 0;
            color: #92400e;
            font-size: 15px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
            position: relative;
            overflow: hidden;
          }
          .expiry-notice::before {
            content: '⏰';
            margin-right: 8px;
            font-size: 16px;
          }
          .security-notice {
            color: #94a3b8;
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 35px 0;
            padding: 0 25px;
            font-weight: 400;
          }
          .footer {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 30px 35px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            position: relative;
          }
          .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
          }
          .footer-text {
            color: #64748b;
            font-size: 14px;
            margin: 0;
            font-weight: 500;
          }
          .footer-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s ease;
          }
          .footer-link:hover {
            color: #764ba2;
            text-decoration: underline;
          }
          @media (max-width: 480px) {
            .email-container { padding: 10px; }
            .email-card { border-radius: 20px; }
            .header { padding: 40px 20px 30px; }
            .content { padding: 40px 25px; }
            .footer { padding: 25px; }
            .reset-code { font-size: 30px; letter-spacing: 8px; }
            .title { font-size: 24px; }
            .description { font-size: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-card">
            <div class="header">
              <div class="logo">
                <svg viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </div>
              <h1 class="app-name">Chat App</h1>
            </div>
            
            <div class="content">
              <h2 class="title">Reset Your Password</h2>
              <p class="description">
                We received a request to reset your password. Enter the verification code below in the app to complete the process securely.
              </p>
              
              <div class="code-container">
                <p class="code-label">Verification Code</p>
                <p class="reset-code">${resetCode}</p>
              </div>
              
              <div class="expiry-notice">
                This code expires in 15 minutes for your security
              </div>
              
              <p class="security-notice">
                If you didn't request this password reset, please ignore this email. Your account remains secure and no action is required.
              </p>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                © ${new Date().getFullYear()} Chat App. All rights reserved.<br>
                <a href="#" class="footer-link">Privacy Policy</a> • <a href="#" class="footer-link">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await sendMail(user.email, 'Reset your password', emailHtml);
    res.json({ msg: 'Password reset code sent.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update resetPassword to accept code instead of token
exports.resetPassword = async (req, res) => {
  const { code, newPassword } = req.body;
  try {
    const user = await User.findOne({ resetPasswordToken: code, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ msg: 'Invalid or expired code' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ msg: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}; 