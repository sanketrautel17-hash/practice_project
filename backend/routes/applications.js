import express from 'express';
import { upload } from '../config/cloudinaryConfig.js';

const router = express.Router();

// In-memory storage (will auto-load with sample data on start)
// In production: replace with MongoDB Application model
let applications = [
    {
        id: 'app_1',
        userId: 'demo_user_id',
        personalDetails: {
            fullName: 'Test Student', dob: '2000-01-01',
            fatherName: 'Mr. Smith', motherName: 'Mrs. Smith',
            address: '123 Exam St', mobile: '9876543210',
            email: 'user@example.com', aadharNumber: '123456789012'
        },
        examType: { _id: 'e1', name: 'NEET UG 2026' },
        category: 'general',
        fee: 1500,
        documents: [{ fileName: 'photo.jpg', s3Url: 'https://mock-s3.example.com/photo.jpg' }],
        status: 'Under Review',
        paymentId: null,
        createdAt: new Date().toISOString()
    }
];

// ─── USER ROUTES ──────────────────────────────────────────────────────────────

// @desc    Submit a new application
// @route   POST /api/applications
// @access  Private (User) — protect middleware applied in server.js
router.post('/', async (req, res) => {
    const appData = req.body;
    const userId = req.user?._id?.toString() || appData.userId;

    const newApp = {
        id: 'app_' + Math.random().toString(36).substring(2, 11),
        userId,
        personalDetails: appData.personalDetails,
        examType: appData.examType,
        category: appData.category,
        fee: appData.fee,
        documents: appData.documents || [],
        status: 'Submitted',
        paymentId: null,
        createdAt: new Date().toISOString()
    };

    applications.push(newApp);
    res.status(201).json(newApp);
});

// @desc    Get current user's applications
// @route   GET /api/applications/my
// @access  Private (User) — protect middleware applied in server.js
router.get('/my', async (req, res) => {
    const userId = req.user?._id?.toString();
    const userApps = applications.filter(app => app.userId === userId);
    res.json(userApps);
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// @desc    Get all applications (admin view)
// @route   GET /api/applications
// @access  Private (Admin) — protect + admin middleware applied in server.js
router.get('/', async (req, res) => {
    res.json(applications);
});

// @desc    Update application status
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

// ─── PAYMENT ROUTES ───────────────────────────────────────────────────────────

// @desc    Mock Razorpay Order Creation
// @route   POST /api/applications/payment/create-order
// @access  Private
router.post('/payment/create-order', async (req, res) => {
    const { amount } = req.body;
    res.json({
        id: 'order_' + Math.random().toString(36).substring(2, 11),
        amount: amount * 100, // in paise
        currency: 'INR'
    });
});

// @desc    Mock Razorpay Payment Verification
// @route   POST /api/applications/payment/verify
// @access  Private
router.post('/payment/verify', async (req, res) => {
    const { applicationId, paymentId } = req.body;

    const appIndex = applications.findIndex(app => app.id === applicationId);
    if (appIndex !== -1) {
        applications[appIndex].status = 'Payment Done';
        applications[appIndex].paymentId = paymentId || 'pay_mock_' + Math.random().toString(36).substring(2, 9);
        res.json({ message: 'Payment verified successfully', application: applications[appIndex] });
    } else {
        res.status(404).json({ message: 'Application not found' });
    }
});

// ─── FILE UPLOAD ──────────────────────────────────────────────────────────────

// @desc    Upload documents to Cloudinary
// @route   POST /api/applications/upload
// @access  Private
router.post('/upload', upload.array('files', 10), (req, res) => {
    try {
        const uploadedDocs = req.files.map(file => ({
            fileName: file.originalname,
            s3Url: file.path  // Cloudinary URL — kept as s3Url for frontend compatibility
        }));
        res.json(uploadedDocs);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Failed to upload files' });
    }
});

export default router;
