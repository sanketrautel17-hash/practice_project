import express from 'express';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Mock In-Memory Database for Applications
let applications = [
    // pre-fill with one sample application for the mockup
    {
        id: 'app_1',
        userId: '2', // matches Test Student from auth.js
        personalDetails: { fullName: "Test Student", dob: "2000-01-01", fatherName: "Mr. Smith", motherName: "Mrs. Smith", address: "123 Exam St", mobile: "9876543210", email: "user@example.com", aadharNumber: "123456789012" },
        examType: { _id: "e1", name: "NEET UG 2026" },
        category: "general",
        fee: 1500,
        documents: [{ fileName: "photo.jpg", s3Url: "https://mock-s3.example.com/photo.jpg" }],
        status: "Under Review",
        paymentId: null,
        createdAt: new Date().toISOString()
    }
];

// @desc    Submit a new application
// @route   POST /api/applications
// @access  Private (User)
router.post('/', async (req, res) => {
    // We skip the 'protect' middleware validation completely for this mockup, 
    // relying entirely on the frontend passing the data or just returning success.
    const appData = req.body;

    const newApp = {
        id: 'app_' + Math.random().toString(36).substr(2, 9),
        userId: appData.userId || '2', // fallback if none provided
        personalDetails: appData.personalDetails,
        examType: appData.examType,
        category: appData.category,
        fee: appData.fee,
        documents: appData.documents || [],
        status: "Submitted",
        paymentId: null,
        createdAt: new Date().toISOString()
    };

    applications.push(newApp);

    res.status(201).json(newApp);
});

// @desc    Get user's applications
// @route   GET /api/applications/my
// @access  Private (User)
router.get('/my', async (req, res) => {
    // For the mockup, just return all applications (or filter by a hardcoded ID if we passed one in queries, but let's just return all for ease of demo)
    // In a real app we'd use req.user._id

    const userId = req.query.userId || '2';
    const userApps = applications.filter(app => app.userId === userId);

    res.json(userApps);
});

// @desc    Get all applications (ADMIN)
// @route   GET /api/applications
// @access  Private (Admin)
router.get('/', async (req, res) => {
    res.json(applications);
});

// @desc    Update application status (ADMIN)
// @route   PATCH /api/applications/:id/status
// @access  Private (Admin)
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body;
    const appIndex = applications.findIndex(app => app.id === req.params.id);

    if (appIndex !== -1) {
        applications[appIndex].status = status;
        res.json(applications[appIndex]);
    } else {
        res.status(404).json({ message: 'Application not found' });
    }
});

// @desc    Mock Razorpay Order Creation
// @route   POST /api/payment/create-order
// @access  Private
router.post('/create-order', async (req, res) => {
    const { amount } = req.body;
    // Mock order creation
    res.json({
        id: 'order_' + Math.random().toString(36).substr(2, 9),
        amount: amount * 100, // in paise
        currency: "INR"
    });
});

// @desc    Mock Razorpay Payment Verification
// @route   POST /api/payment/verify
// @access  Private
router.post('/verify', async (req, res) => {
    const { applicationId, paymentId, orderId, signature } = req.body;

    const appIndex = applications.findIndex(app => app.id === applicationId);
    if (appIndex !== -1) {
        applications[appIndex].status = "Payment Done";
        applications[appIndex].paymentId = paymentId || 'pay_mock_' + Math.random().toString(36).substr(2, 9);
        res.json({ message: 'Payment verified successfully', application: applications[appIndex] });
    } else {
        res.status(404).json({ message: 'Application not found' });
    }
});

import { upload } from '../config/cloudinaryConfig.js';

// @desc    Upload documents to Cloudinary
// @route   POST /api/upload
// @access  Public (Should be private in production)
router.post('/upload', upload.array('files', 5), (req, res) => {
    try {
        const uploadedDocs = req.files.map(file => ({
            fileName: file.originalname,
            s3Url: file.path // Using s3Url key to keep frontend compatibility, but it's a Cloudinary URL
        }));

        res.json(uploadedDocs);
    } catch (error) {
        console.error("Upload error", error);
        res.status(500).json({ message: "Failed to upload files" });
    }
});

export default router;
