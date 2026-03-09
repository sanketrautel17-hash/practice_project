import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const Login = () => {
    const [mode, setMode] = useState('password'); // 'password' | 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // ── Password Login ────────────────────────────────────────────────────────
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                // Redirect to verify if unverified
                if (data.requiresVerification) {
                    navigate('/verify-email', { state: { email } });
                    return;
                }
                throw new Error(data.message || 'Login failed');
            }

            login(data);
            navigate(data.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── OTP Login: Step 1 — Request OTP ──────────────────────────────────────
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login-otp/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not send OTP');
            setOtpSent(true);
            toast.success('OTP sent! Check your email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── OTP Login: Step 2 — Verify OTP ───────────────────────────────────────
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login-otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'OTP verification failed');
            login(data);
            navigate(data.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-primary-600 to-green-400 transform -skew-y-6 z-0 -mt-32" />

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-sm text-gray-500">Sign in to your NetCafe Connect account.</p>
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">{error}</div>}

                    {/* ── Google Sign-In ── */}
                    <a
                        href="/api/auth/google"
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all shadow-sm mb-6"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </a>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-gray-400">or sign in with</span>
                        </div>
                    </div>

                    {/* ── Mode Toggle ── */}
                    <div className="flex rounded-xl border border-gray-200 p-1 mb-6 bg-gray-50">
                        <button onClick={() => { setMode('password'); setError(''); setOtpSent(false); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            Password
                        </button>
                        <button onClick={() => { setMode('otp'); setError(''); setOtpSent(false); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            OTP (Passwordless)
                        </button>
                    </div>

                    {/* ── Password Form ── */}
                    {mode === 'password' && (
                        <form className="space-y-4" onSubmit={handlePasswordLogin}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition-all"
                                        placeholder="you@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition-all"
                                        placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <button type="submit" disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-dark-900 hover:bg-dark-800 disabled:opacity-70 focus:outline-none transition-all shadow-md hover:shadow-lg">
                                {loading ? 'Signing in...' : 'Sign In'}
                                {!loading && <span className="absolute right-0 inset-y-0 flex items-center pr-3"><ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" /></span>}
                            </button>
                        </form>
                    )}

                    {/* ── OTP Form ── */}
                    {mode === 'otp' && (
                        <form className="space-y-4" onSubmit={otpSent ? handleVerifyOTP : handleRequestOTP}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={otpSent}
                                        className="w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition-all disabled:bg-gray-50"
                                        placeholder="you@example.com" />
                                </div>
                            </div>
                            {otpSent && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                                    <input type="text" inputMode="numeric" maxLength={6} required value={otp} onChange={e => setOtp(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 text-center text-xl font-bold tracking-widest"
                                        placeholder="— — — — — —" />
                                    <p className="text-xs text-gray-500 mt-1 text-center">Check your email for the 6-digit code</p>
                                </div>
                            )}
                            <button type="submit" disabled={loading}
                                className="w-full py-3 px-4 text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 transition-all shadow-md">
                                {loading ? (otpSent ? 'Verifying...' : 'Sending OTP...') : (otpSent ? 'Verify & Login' : 'Send OTP')}
                            </button>
                            {otpSent && (
                                <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors">
                                    ← Change email
                                </button>
                            )}
                        </form>
                    )}

                    <div className="mt-8 text-center text-sm">
                        <span className="text-gray-500">Don't have an account? </span>
                        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">Create an account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
