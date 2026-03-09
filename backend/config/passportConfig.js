import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in .env');
} else {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    const profilePhoto = profile.photos?.[0]?.value;
                    const name = profile.displayName;
                    const googleId = profile.id;

                    // Check if user already exists (by googleId or email)
                    let user = await User.findOne({ googleId });

                    if (!user) {
                        // Maybe they registered with email before — link accounts
                        user = await User.findOne({ email });
                    }

                    if (user) {
                        // Link google account to existing user if not already linked
                        if (!user.googleId) {
                            user.googleId = googleId;
                            user.profilePhoto = profilePhoto;
                            user.isEmailVerified = true; // Google-verified emails are trusted
                            await user.save();
                        }
                        return done(null, user);
                    }

                    // Create a new user from Google profile
                    const newUser = await User.create({
                        name,
                        email,
                        googleId,
                        profilePhoto,
                        isEmailVerified: true, // Google already verified the email
                        role: 'user',
                        // password, mobile, address are optional and not set for Google users
                    });

                    return done(null, newUser);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
} // end else (Google OAuth configured)

export default passport;
