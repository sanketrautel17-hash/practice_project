import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const PrivateRoute = ({ children, roleRequired }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex justify-center mt-20">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roleRequired && user.role !== roleRequired) {
        // If role doesn't match, redirect to their respective dashboard
        return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
    }

    return children;
};

export default PrivateRoute;
