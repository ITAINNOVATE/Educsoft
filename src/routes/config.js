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
            where: { establishmentId: req.user.establishmentId },
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
router.post('/school-years', protect, authorize('ADMIN', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), async (req, res) => {
    const { name, startDate, endDate, current } = req.body;
    console.log('--- POST /api/config/school-years ---');
    console.log('Payload:', { name, startDate, endDate, current });

    try {
        // If setting as current, unset others
        if (current) {
            console.log('Unsetting previous current school years...');
            await prisma.schoolYear.updateMany({
                where: { 
                    current: true,
                    establishmentId: req.user.establishmentId
                },
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
                establishmentId: req.user.establishmentId
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
            where: {
                establishmentId: req.user.establishmentId,
                ...(schoolYearId ? { schoolYearId } : {})
            },
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
router.post('/classes', protect, authorize('ADMIN', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), async (req, res) => {
    const { name, level, schoolYearId } = req.body;

    try {
        const newClass = await prisma.class.create({
            data: {
                name,
                level,
                schoolYearId,
                establishmentId: req.user.establishmentId
            },
        });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- Subject Management ---

// @desc    Get subjects for a class
// @route   GET /api/config/subjects/:classId
router.get('/subjects/:classId', protect, async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({
            where: { 
                classId: req.params.classId,
                establishmentId: req.user.establishmentId 
            },
            orderBy: { name: 'asc' },
        });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Create a new subject
// @route   POST /api/config/subjects
router.post('/subjects', protect, authorize('ADMIN', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), async (req, res) => {
    const { name, code, coefficient, classId } = req.body;

    try {
        const subject = await prisma.subject.create({
            data: {
                name,
                code,
                coefficient: parseFloat(coefficient) || 1.0,
                classId,
                establishmentId: req.user.establishmentId
            },
        });
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Delete a subject
// @route   DELETE /api/config/subjects/:id
router.delete('/subjects/:id', protect, authorize('ADMIN', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), async (req, res) => {
    try {
        await prisma.subject.delete({
            where: { 
                id: req.params.id,
                establishmentId: req.user.establishmentId
            },
        });
        res.json({ message: 'Matière supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- Term Management ---

// @desc    Get terms for a school year
// @route   GET /api/config/terms/:schoolYearId
router.get('/terms/:schoolYearId', protect, async (req, res) => {
    try {
        const terms = await prisma.term.findMany({
            where: { schoolYearId: req.params.schoolYearId },
            orderBy: { createdAt: 'asc' },
        });
        res.json(terms);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Create a new term
// @route   POST /api/config/terms
router.post('/terms', protect, authorize('ADMIN', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), async (req, res) => {
    const { name, startDate, endDate, schoolYearId } = req.body;

    try {
        const term = await prisma.term.create({
            data: {
                name,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                schoolYearId
            },
        });
        res.status(201).json(term);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Delete a term
// @route   DELETE /api/config/terms/:id
router.delete('/terms/:id', protect, authorize('ADMIN', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), async (req, res) => {
    try {
        await prisma.term.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Trimestre supprimé' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
