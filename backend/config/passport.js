const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User'); // Import the User model
const jwt = require('jsonwebtoken'); // Import JWT
const { URL } = require('url'); // Import the URL constructor

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

module.exports = function(passport) {
  // Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: new URL('/api/auth/google/callback', process.env.BASE_URL).toString()
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    if (!email) {
      return done(new Error("Email not provided by Google."), null);
    }

    const newUser = {
      googleId: profile.id,
      username: profile.displayName || email.split('@')[0],
      email: email,
      first_name: profile.name ? profile.name.givenName : '',
      last_name: profile.name ? profile.name.familyName : '',
      profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
      isVerified: true
    };

    try {
      let user = await User.findOne({ email: newUser.email });
      if (user) {
        // If user exists, update with Google ID if it's not already set
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        done(null, user);
      } else {
        user = await User.create(newUser);
        done(null, user);
      }
    } catch (err) {
      console.error(err);
      done(err, null);
    }
  }));

  // Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: new URL('/api/auth/facebook/callback', process.env.BASE_URL).toString(),
    profileFields: ['id', 'displayName', 'photos', 'email', 'name']
  },
  async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    if (!email) {
      return done(new Error("Email not provided by Facebook."), null);
    }
    
    const newUser = {
      facebookId: profile.id,
      username: profile.displayName || email.split('@')[0],
      email: email,
      first_name: profile.name ? profile.name.givenName : '',
      last_name: profile.name ? profile.name.familyName : '',
      profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
      isVerified: true
    };

    try {
      let user = await User.findOne({ email: newUser.email });
      if (user) {
        if (!user.facebookId) {
          user.facebookId = profile.id;
          await user.save();
        }
        done(null, user);
      } else {
        user = await User.create(newUser);
        done(null, user);
      }
    } catch (err) {
      console.error(err);
      done(err, null);
    }
  }));

  // GitHub Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: new URL('/api/auth/github/callback', process.env.BASE_URL).toString(),
    scope: ['user:email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    // GitHub provides email in a variety of places
    let email = null;
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    } else if (profile._json && profile._json.email) {
      email = profile._json.email;
    }

    if (!email) {
      return done(new Error("Email not provided by GitHub or is private."), null);
    }

    const newUser = {
      githubId: profile.id,
      username: profile.username || email.split('@')[0],
      email: email,
      profileImage: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
      isVerified: true
    };

    try {
      let user = await User.findOne({ email: newUser.email });
      if (user) {
        if (!user.githubId) {
          user.githubId = profile.id;
          await user.save();
        }
        done(null, user);
      } else {
        user = await User.create(newUser);
        done(null, user);
      }
    } catch (err) {
      console.error(err);
      done(err, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}; 