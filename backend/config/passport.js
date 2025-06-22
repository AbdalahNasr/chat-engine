const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple');
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-azure-ad').OIDCStrategy;

module.exports = function() {
  // Google
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.BASE_URL + '/api/auth/google/callback',
  }, (accessToken, refreshToken, profile, done) => {
    console.log('Google profile:', profile);
    // TODO: Find or create user in DB
    return done(null, profile);
  }));

  // Facebook
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackURL: process.env.BASE_URL + '/api/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  }, (accessToken, refreshToken, profile, done) => {
    console.log('Facebook profile:', profile);
    // TODO: Find or create user in DB
    return done(null, profile);
  }));

  // Apple
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID || '',
    teamID: process.env.APPLE_TEAM_ID || '',
    keyID: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY || '',
    callbackURL: process.env.BASE_URL + '/api/auth/apple/callback',
    scope: ['name', 'email']
  }, (accessToken, refreshToken, idToken, profile, done) => {
    console.log('Apple profile:', profile);
    // TODO: Find or create user in DB
    return done(null, profile);
  }));

  // GitHub
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.BASE_URL + '/api/auth/github/callback',
    scope: ['user:email']
  }, (accessToken, refreshToken, profile, done) => {
    console.log('GitHub profile:', profile);
    // TODO: Find or create user in DB
    return done(null, profile);
  }));

  // Microsoft
  passport.use(new MicrosoftStrategy({
    identityMetadata: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: process.env.BASE_URL + '/api/auth/microsoft/callback',
    allowHttpForRedirectUrl: true,
    scope: ['profile', 'email', 'openid']
  }, (iss, sub, profile, accessToken, refreshToken, done) => {
    console.log('Microsoft profile:', profile);
    // TODO: Find or create user in DB
    return done(null, profile);
  }));

  // Serialize/deserialize
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });
}; 