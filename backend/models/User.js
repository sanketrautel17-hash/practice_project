import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        // Optional: Google OAuth users don't have a password
        password: {
            type: String,
            required: false,
        },
        // Optional: filled in later via profile completion
        mobile: {
            type: String,
            required: false,
        },
        address: {
            type: String,
            required: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        // ── Google OAuth ──────────────────────────────
        googleId: {
            type: String,
            default: null,
        },
        profilePhoto: {
            type: String,
            default: null,
        },

        // ── Email Verification (OTP) ──────────────────
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,         // stored as bcrypt hash
            default: null,
        },
        otpExpiry: {
            type: Date,
            default: null,
        },

        // ── Password Reset ────────────────────────────
        resetPasswordToken: {
            type: String,         // stored as sha256 hash
            default: null,
        },
        resetPasswordExpiry: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false; // Google-only users have no password
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt before saving (only if modified)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);
export default User;
