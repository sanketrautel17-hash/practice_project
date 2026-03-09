import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

/**
 * Send a 6-digit OTP email for login or email verification
 * @param {string} toEmail - recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - 'verify' | 'login'
 */
export const sendOTPEmail = async (toEmail, otp, purpose = 'verify') => {
    const isLogin = purpose === 'login';
    const subject = isLogin
        ? 'Your NetCafe Connect Login OTP'
        : 'Verify Your Email — NetCafe Connect';

    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">NetCafe Connect</h2>
        <p style="color: #555; font-size: 15px; margin-bottom: 24px;">
            ${isLogin
                ? 'Use the OTP below to complete your login. It expires in <strong>10 minutes</strong>.'
                : 'Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.'}
        </p>
        <div style="background: #1a1a2e; color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 24px 16px; border-radius: 10px; margin-bottom: 24px;">
            ${otp}
        </div>
        <p style="color: #888; font-size: 12px;">If you did not request this, please ignore this email. Do not share this OTP with anyone.</p>
    </div>`;

    await transporter.sendMail({
        from: `"NetCafe Connect" <${process.env.SMTP_EMAIL}>`,
        to: toEmail,
        subject,
        html: htmlBody,
    });
};

/**
 * Send a password reset link email
 * @param {string} toEmail - recipient email
 * @param {string} resetLink - full URL with token, e.g. http://localhost:5173/reset-password/TOKEN
 */
export const sendResetPasswordEmail = async (toEmail, resetLink) => {
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Reset Your Password</h2>
        <p style="color: #555; font-size: 15px; margin-bottom: 24px;">
            We received a request to reset the password for your NetCafe Connect account.
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetLink}"
           style="display: inline-block; background: #16a34a; color: #fff; font-weight: bold;
                  text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; margin-bottom: 24px;">
            Reset Password
        </a>
        <p style="color: #888; font-size: 12px;">
            If you did not request a password reset, you can safely ignore this email.<br/>
            Link: <a href="${resetLink}" style="color: #16a34a;">${resetLink}</a>
        </p>
    </div>`;

    await transporter.sendMail({
        from: `"NetCafe Connect" <${process.env.SMTP_EMAIL}>`,
        to: toEmail,
        subject: 'Reset Your Password — NetCafe Connect',
        html: htmlBody,
    });
};
