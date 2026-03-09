import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret123', {
        expiresIn: '30d',
    });
};

// MOCK DATA
const mockUsers = [
    {
        _id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        password: 'password123', // plain text for mockup
    },
    {
        _id: '2',
        name: 'Test Student',
        email: 'user@example.com',
        role: 'user',
        password: 'password123',
    }
];

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password, mobile, address } = req.body;

    // Mock implementation
    const newUser = {
        _id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role: 'user', // Default role
    };
    mockUsers.push({ ...newUser, password });

    res.status(201).json({
        ...newUser,
        token: generateToken(newUser._id),
    });
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Mock implementation
    let user = mockUsers.find(u => u.email === email);

    // If not found, just authenticate as user anyway for the mockup to show the UI
    if (!user) {
        user = {
            _id: Math.random().toString(36).substr(2, 9),
            name: 'Guest User',
            email: email,
            role: email.includes('admin') ? 'admin' : 'user',
        };
    }

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete || false,
        profileData: user.profileData || null,
        token: generateToken(user._id),
    });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Public (mock)
router.get('/profile', (req, res) => {
    const userId = req.query.userId;
    const user = mockUsers.find(u => u._id === userId);
    if (user) {
        res.json({
            isProfileComplete: user.isProfileComplete || false,
            profileData: user.profileData || null
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Public (mock)
router.put('/profile', (req, res) => {
    const { userId, profileData } = req.body;
    const index = mockUsers.findIndex(u => u._id === userId);

    if (index !== -1) {
        mockUsers[index].profileData = profileData;
        mockUsers[index].isProfileComplete = true;
        res.json(mockUsers[index]);
    } else {
        // Fallback for new guest users missing from array
        const newUser = { _id: userId, role: 'user', profileData, isProfileComplete: true };
        mockUsers.push(newUser);
        res.json(newUser);
    }
});

export default router;
