import { Link, useNavigate } from 'react-router-dom';
import { Monitor, User, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="glassmorphism sticky top-0 z-50 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary-500 p-2 rounded-lg group-hover:bg-primary-600 transition-colors">
                                <Monitor className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-dark-900 group-hover:text-primary-600 transition-colors">NetCafe <span className="font-light">Connect</span></span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="text-gray-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-2">
                                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                                </Link>
                                <button onClick={handleLogout} className="bg-dark-900 text-white px-5 py-2 rounded-full font-medium hover:bg-dark-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-2">
                                    <LogIn className="w-4 h-4" /> Login
                                </Link>
                                <Link to="/register" className="bg-dark-900 text-white px-5 py-2 rounded-full font-medium hover:bg-dark-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                    <User className="w-4 h-4" /> Create Account
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
