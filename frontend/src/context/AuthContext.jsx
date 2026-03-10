import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextObject';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user info and token exist in localStorage
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('userInfo');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('userInfo', JSON.stringify(userData));
    };

    const updateProfile = (updatedProfileData) => {
        const updatedUser = { ...user, isProfileComplete: true, profileData: updatedProfileData };
        setUser(updatedUser);
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
