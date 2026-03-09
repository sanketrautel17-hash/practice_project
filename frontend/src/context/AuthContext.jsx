import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ── Google OAuth Callback Handler ─────────────────────────────────────
        // After Google login, backend redirects to: /auth/callback?token=...&name=...
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token && window.location.pathname === '/auth/callback') {
            const userData = {
                _id: params.get('id'),
                name: decodeURIComponent(params.get('name') || ''),
                email: decodeURIComponent(params.get('email') || ''),
                role: params.get('role') || 'user',
                profilePhoto: decodeURIComponent(params.get('photo') || ''),
                token,
            };
            setUser(userData);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            // Clean URL — remove query params
            window.history.replaceState({}, document.title, '/dashboard');
            setLoading(false);
            return;
        }

        // ── Normal session restore from localStorage ──────────────────────────
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
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
