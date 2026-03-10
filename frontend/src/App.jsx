import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ApplicationForm from './pages/ApplicationForm';
import ProfileCompletion from './pages/ProfileCompletion';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col font-sans">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* User Protected Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute roleRequired="user">
                  <UserDashboard />
                </PrivateRoute>
              } />

              <Route path="/apply" element={
                <PrivateRoute roleRequired="user">
                  <ApplicationForm />
                </PrivateRoute>
              } />

              <Route path="/profile-setup" element={
                <PrivateRoute roleRequired="user">
                  <ProfileCompletion />
                </PrivateRoute>
              } />

              {/* Admin Protected Routes */}
              <Route path="/admin/dashboard" element={
                <PrivateRoute roleRequired="admin">
                  <AdminDashboard />
                </PrivateRoute>
              } />
            </Routes>
          </main>
          <footer className="bg-dark-900 text-white py-8 text-center text-sm">
            <p>&copy; 2026 Admin Portal. All rights reserved.</p>
          </footer>
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
