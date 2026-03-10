import express from 'express';

const router = express.Router();

// Mock In-Memory Database for Exams
let exams = [
    {
        id: 'e1',
        name: 'NEET UG 2026',
        fees: { general: 1500, obc: 1400, sc: 800, st: 800 },
        createdAt: new Date().toISOString()
    },
    {
        id: 'e2',
        name: 'JEE Main 2026',
        fees: { general: 1000, obc: 900, sc: 500, st: 500 },
        createdAt: new Date().toISOString()
    },
    {
        id: 'e3',
        name: 'UPSC Civil Services',
        fees: { general: 100, obc: 100, sc: 0, st: 0 },
        createdAt: new Date().toISOString()
    }
];

// @route   GET /api/admin/exams
// @desc    Get all exams
router.get('/exams', (req, res) => {
    res.json(exams);
});

// @route   POST /api/admin/exams
// @desc    Create an exam
router.post('/exams', (req, res) => {
    const { name, fees } = req.body;
    const newExam = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        fees,
        createdAt: new Date().toISOString()
    };
    exams.push(newExam);
    res.status(201).json(newExam);
});

// @route   PUT /api/admin/exams/:id
// @desc    Update an exam
router.put('/exams/:id', (req, res) => {
    const { name, fees } = req.body;
    const index = exams.findIndex(e => e.id === req.params.id);

    if (index !== -1) {
        exams[index] = { ...exams[index], name, fees };
        res.json(exams[index]);
    } else {
        res.status(404).json({ message: 'Exam not found' });
    }
});

// @route   DELETE /api/admin/exams/:id
// @desc    Delete an exam
router.delete('/exams/:id', (req, res) => {
    exams = exams.filter(e => e.id !== req.params.id);
    res.json({ message: 'Exam removed' });
});

let profileConfig = {
    requiredDocuments: [
        { id: 'aadhar', name: 'Aadhar Card' },
        { id: 'pan', name: 'PAN Card' },
        { id: '10th', name: '10th Marksheet' },
        { id: '12th', name: '12th Marksheet' },
        { id: 'passport', name: 'Passport Size Photo' }
    ],
    customFields: []
};

// @route   GET /api/admin/profile-config
// @desc    Get master profile requirements
router.get('/profile-config', (req, res) => {
    res.json(profileConfig);
});

// @route   PUT /api/admin/profile-config
// @desc    Update master profile requirements
router.put('/profile-config', (req, res) => {
    if (req.body.requiredDocuments) profileConfig.requiredDocuments = req.body.requiredDocuments;
    if (req.body.customFields) profileConfig.customFields = req.body.customFields;
    res.json(profileConfig);
});

export default router;
