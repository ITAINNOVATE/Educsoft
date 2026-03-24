const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// --- School Year Management ---

// @desc    Get all school years
// @route   GET /api/config/school-years
// @access  Private
router.get('/school-years', protect, async (req, res) => {
    try {
        const years = await prisma.schoolYear.findMany({
            orderBy: { startDate: 'desc' },
        });
        res.json(years);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Create a new school year
// @route   POST /api/config/school-years
// @access  Private/Admin
router.post('/school-years', protect, authorize('ADMIN', 'DIRECTOR'), async (req, res) => {
    const { name, startDate, endDate, current } = req.body;
    console.log('--- POST /api/config/school-years ---');
    console.log('Payload:', { name, startDate, endDate, current });

    try {
        // If setting as current, unset others
        if (current) {
            console.log('Unsetting previous current school years...');
            await prisma.schoolYear.updateMany({
                where: { current: true },
                data: { current: false },
            });
        }

        console.log('Creating new school year...');
        const year = await prisma.schoolYear.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                current: !!current,
            },
        });
        console.log('Success:', year);
        res.status(201).json(year);
    } catch (error) {
        console.error('Error creating school year:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- Class Management ---

// @desc    Get all classes
// @route   GET /api/config/classes
// @access  Private
router.get('/classes', protect, async (req, res) => {
    const { schoolYearId } = req.query;

    try {
        const classes = await prisma.class.findMany({
            where: schoolYearId ? { schoolYearId } : {},
            include: {
                schoolYear: true,
                fees: true
            },
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Create a new class
// @route   POST /api/config/classes
// @access  Private/Admin
router.post('/classes', protect, authorize('ADMIN', 'DIRECTOR'), async (req, res) => {
    const { name, level, schoolYearId } = req.body;

    try {
        const newClass = await prisma.class.create({
            data: {
                name,
                level,
                schoolYearId,
            },
        });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
