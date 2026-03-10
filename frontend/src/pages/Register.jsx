import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import { readApiResponse } from '../utils/http';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });
            const data = await readApiResponse(res);
            if (!res.ok) throw new Error(data.message || 'Google signup failed');

            login(data);
            if (!data.isProfileComplete) navigate('/profile-setup');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google Signup failed. Please try again.');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await readApiResponse(res);

            if (!res.ok) {
                throw new Error(data.message || `Registration failed (HTTP ${res.status})`);
            }

            login(data); // Auto login user globally
            navigate('/profile-setup'); // Brand new user needs to complete profile

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

            {/* Decorative backdrops */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-green-50 to-primary-50 z-0 opacity-50"></div>

            <div className="max-w-2xl w-full relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-100">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create Your Account</h2>
                        <p className="text-sm text-gray-500">
                            Join thousands of students managing their applications easily.
                        </p>
                    </div>

                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">{error}</div>}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="appearance-none w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all" placeholder="John Doe" />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="appearance-none w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all" placeholder="you@example.com" />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="appearance-none w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all" placeholder="+91 98765 43210" />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="appearance-none w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all" placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <textarea rows="3" name="address" value={formData.address} onChange={handleChange} required className="appearance-none w-full px-3 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all" placeholder="123 Main Street, City, State, ZIP"></textarea>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                                {loading ? 'Processing...' : 'Complete Registration'}
                                {!loading && (
                                    <span className="absolute right-0 inset-y-0 flex items-center pr-4">
                                        <ArrowRight className="h-5 w-5 text-primary-200 group-hover:text-white transition-colors" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap
                            />
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm border-t border-gray-100 pt-6">
                        <span className="text-gray-500">Already a member? </span>
                        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                            Sign in to your account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
