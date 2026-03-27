const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all teacher payments
// @route   GET /api/teacher-payments
// @access  Private (Admin & Accountant)
router.get('/', protect, authorize(['ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const where = { establishmentId: req.user.establishmentId };
        if (teacherId) where.teacherId = teacherId;
        if (period) where.period = period;
        if (type) where.type = type;

        const payments = await prisma.teacherPayment.findMany({
            where,
            include: {
                teacher: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            },
            orderBy: { paymentDate: 'desc' }
        });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments', error: error.message });
    }
});

// @desc    Create a new payment
// @route   POST /api/teacher-payments
// @access  Private (Admin & Accountant)
router.post('/', protect, authorize(['ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { teacherId, amount, period, type, notes, reference } = req.body;

        const payment = await prisma.teacherPayment.create({
            data: {
                teacherId,
                amount: parseFloat(amount),
                period,
                type,
                notes,
                reference,
                establishmentId: req.user.establishmentId
            }
        });

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating payment', error: error.message });
    }
});

// @desc    Get payment stats
// @route   GET /api/teacher-payments/stats
// @access  Private (Admin & Accountant)
router.get('/stats', protect, authorize(['ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Total paid per type for current year
        const stats = await prisma.teacherPayment.groupBy({
            by: ['type'],
            _sum: { amount: true },
            where: {
                period: { startsWith: String(currentYear) },
                establishmentId: req.user.establishmentId
            }
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

module.exports = router;
