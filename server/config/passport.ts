import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

// Configure Google OAuth only if client ID is available
if (process.env.GOOGLE_CLIENT_ID) {
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    passReqToCallback: true,
    // Required for Replit environment and secure cookies
    proxy: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with the same email
      if (profile.emails && profile.emails.length > 0) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email });
        
        if (user) {
          // Update existing user with Google information
          user.googleId = profile.id;
          user.authProvider = 'google';
          if (profile.photos && profile.photos.length > 0) {
            user.profilePicture = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }
      }
      
      // Create a new user
      if (profile.emails && profile.emails.length > 0) {
        const newUser = new User({
          email: profile.emails[0].value,
          name: profile.displayName || 'Google User',
          googleId: profile.id,
          authProvider: 'google',
          profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
        });
        
        await newUser.save();
        return done(null, newUser);
      } else {
        return done(new Error('Google profile does not contain an email address'));
      }
    } catch (error) {
      return done(error);
    }
  }
));
}

// Serialization and Deserialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;