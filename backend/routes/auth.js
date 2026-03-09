import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import passport from '../config/passportConfig.js';
import User from '../models/User.js';
import { sendOTPEmail, sendResetPasswordEmail } from '../utils/emailService.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret123', {
        expiresIn: '30d',
    });
};

/** Generate a random 6-digit OTP */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── REGISTER ────────────────────────────────────────────────────────────────

// @desc    Register a new user (email + password)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, mobile, address } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
    }

    try {
        // Check for duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Generate OTP for email verification
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const user = await User.create({
            name,
            email,
            password,
            mobile: mobile || undefined,
            address: address || undefined,
            otp: otpHash,
            otpExpiry,
            isEmailVerified: false,
        });

        // Send OTP to user's email
        await sendOTPEmail(email, otp, 'verify');

        res.status(201).json({
            message: 'Registration successful! Please verify your email with the OTP sent.',
            userId: user._id,
            email: user.email,
            requiresVerification: true,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// ─── EMAIL VERIFICATION (OTP after Register) ──────────────────────────────────

// @desc    Verify email using OTP sent after registration
// @route   POST /api/auth/verify-email
// @access  Public
router.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }
        if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        const isOTPValid = await bcrypt.compare(otp, user.otp);
        if (!isOTPValid) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // Mark email as verified, clear OTP
        user.isEmailVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: true,
            profilePhoto: user.profilePhoto,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Server error during email verification' });
    }
});

// ─── RESEND OTP ───────────────────────────────────────────────────────────────

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isEmailVerified) return res.status(400).json({ message: 'Email is already verified' });

        const otp = generateOTP();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOTPEmail(email, otp, 'verify');

        res.json({ message: 'OTP resent successfully. Please check your email.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── LOGIN (email + password) ────────────────────────────────────────────────

// @desc    Login with email and password
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.password) {
            return res.status(400).json({
                message: 'This account uses Google Sign-In. Please login with Google.'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isEmailVerified) {
            // Resend OTP silently
            const otp = generateOTP();
            user.otp = await bcrypt.hash(otp, 10);
            user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();
            await sendOTPEmail(email, otp, 'verify');
            return res.status(403).json({
                message: 'Please verify your email first. A new OTP has been sent.',
                requiresVerification: true,
                email,
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isProfileComplete: !!(user.mobile && user.address),
            profilePhoto: user.profilePhoto,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ─── OTP LOGIN (passwordless) ─────────────────────────────────────────────────

// @desc    Request OTP for passwordless login
// @route   POST /api/auth/login-otp/request
// @access  Public
router.post('/login-otp/request', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        const otp = generateOTP();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOTPEmail(email, otp, 'login');

        res.json({ message: 'OTP sent to your email. Valid for 10 minutes.', email });
    } catch (error) {
        console.error('OTP login request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Verify OTP and login (passwordless)
// @route   POST /api/auth/login-otp/verify
// @access  Public
router.post('/login-otp/verify', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
        }

        const isOTPValid = await bcrypt.compare(otp, user.otp);
        if (!isOTPValid) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // Clear OTP + mark email verified (if they logged in, their email is valid)
        user.otp = null;
        user.otpExpiry = null;
        user.isEmailVerified = true;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isProfileComplete: !!(user.mobile && user.address),
            profilePhoto: user.profilePhoto,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('OTP login verify error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

// @desc    Send password reset link to email
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await User.findOne({ email });

        // Always respond the same to prevent email enumeration attacks
        const genericMsg = 'If an account exists with that email, a reset link has been sent.';

        if (!user || user.googleId) {
            return res.json({ message: genericMsg });
        }

        // Generate a secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientURL}/reset-password/${rawToken}`;

        await sendResetPasswordEmail(email, resetLink);

        res.json({ message: genericMsg });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

// @desc    Set new password using reset token from email
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpiry: { $gt: new Date() }, // token not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Reset link is invalid or has expired' });
        }

        user.password = password; // will be hashed by pre-save hook
        user.resetPasswordToken = null;
        user.resetPasswordExpiry = null;
        await user.save();

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────

// @desc    Redirect to Google OAuth login page
// @route   GET /api/auth/google
// @access  Public
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
}));

// @desc    Google OAuth callback — issue JWT and redirect to frontend
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        const user = req.user;
        const token = generateToken(user._id);

        const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
        // Redirect to frontend with token in query param — frontend stores it in context
        res.redirect(`${clientURL}/auth/callback?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&id=${user._id}&photo=${encodeURIComponent(user.profilePhoto || '')}`);
    }
);

// ─── PROFILE ──────────────────────────────────────────────────────────────────

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -otp -resetPasswordToken');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({
            isProfileComplete: !!(user.mobile && user.address),
            profileData: { mobile: user.mobile, address: user.address }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update user profile (mobile, address)
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const { mobile, address } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (mobile) user.mobile = mobile;
        if (address) user.address = address;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mobile: user.mobile,
            address: user.address,
            isProfileComplete: !!(user.mobile && user.address),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
