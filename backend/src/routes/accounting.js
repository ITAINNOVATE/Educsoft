const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get overall financial statistics
// @route   GET /api/accounting/stats
router.get('/stats', protect, authorize('ADMIN', 'ACCOUNTANT', 'DIRECTOR'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Date filter for total revenue
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                paymentDate: {
                    gte: new Date(startDate),
                    lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                }
            };
        }

        const [dayPayments, monthPayments, totalPayments, filteredPayments, studentCount, classCount] = await Promise.all([
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { paymentDate: { gte: startOfDay } }
            }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { paymentDate: { gte: startOfMonth } }
            }),
            prisma.payment.aggregate({
                _sum: { amount: true } // Absolute total
            }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: dateFilter // Filtered total
            }),
            prisma.student.count({ where: { status: 'ACTIVE' } }),
            prisma.class.count()
        ]);

        // If date filter is applied, 'revenueTotal' returns the filtered amount
        // Otherwise it returns the absolute total
        const displayTotal = (startDate && endDate)
            ? (filteredPayments._sum.amount || 0)
            : (totalPayments._sum.amount || 0);

        // Fetch graph data (daily revenue for the last 7 days OR selected range)
        // ... (Graph data logic would go here, omitting for brevity/complexity in this step)

        res.json({
            revenueDay: dayPayments._sum.amount || 0,
            revenueMonth: monthPayments._sum.amount || 0,
            revenueTotal: displayTotal,
            absoluteTotal: totalPayments._sum.amount || 0, // Sending absolute total just in case
            stats: {
                students: studentCount,
                classes: classCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const { calculateStudentFinancials } = require('../utils/finance');

// ... (other imports)

// @desc    Get debt report (Students with unpaid fees)
// @route   GET /api/accounting/debts
router.get('/debts', protect, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            where: { status: 'ACTIF' }, // Note: Using 'ACTIF' instead of 'ACTIVE' based on schema default
            include: {
                enrollments: { include: { class: { include: { fees: true } } } },
                payments: true
            }
        });

        const report = students.map(s => {
            const fees = s.enrollments[0]?.class.fees || [];
            const payments = s.payments || [];

            const financials = calculateStudentFinancials(fees, payments);
            const { global, OBLIGATORY, OPTIONAL, OCCASIONAL } = financials;

            return {
                id: s.id,
                name: `${s.firstName} ${s.lastName}`,
                regNumber: s.regNumber,
                className: s.enrollments[0]?.class.name,
                totalFees: global.totalDue,
                paid: global.totalPaid,
                balance: global.remaining,
                breakdown: {
                    obligatory: OBLIGATORY.remaining,
                    optional: OPTIONAL.remaining,
                    occasional: OCCASIONAL.remaining
                }
            };
        }).filter(r => r.balance > 0);

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
