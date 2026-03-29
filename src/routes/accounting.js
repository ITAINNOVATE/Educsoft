const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const { generateAccountingReport } = require('../services/reportService');

// @desc    Get overall financial statistics
// @route   GET /api/accounting/stats
router.get('/stats', protect, authorize('ADMIN', 'ACCOUNTANT', 'DIRECTOR', 'SUPER_ADMIN'), async (req, res) => {
    try {
        if (!req.user.establishmentId) {
            return res.status(400).json({ 
                message: 'Aucun établissement sélectionné',
                requiresSelection: true 
            });
        }
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

        // Individual queries for better diagnostics
        let dayPayments = { _sum: { amount: 0 } };
        let monthPayments = { _sum: { amount: 0 } };
        let totalPayments = { _sum: { amount: 0 } };
        let filteredPayments = { _sum: { amount: 0 } };
        let studentCount = 0;
        let classCount = 0;

        try {
            dayPayments = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: { 
                    paymentDate: { gte: startOfDay },
                    establishmentId: req.user.establishmentId
                }
            });
        } catch (e) { console.error("Error fetching dayPayments:", e.message); }

        try {
            monthPayments = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: { 
                    paymentDate: { gte: startOfMonth },
                    establishmentId: req.user.establishmentId
                }
            });
        } catch (e) { console.error("Error fetching monthPayments:", e.message); }

        try {
            totalPayments = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: { establishmentId: req.user.establishmentId } 
            });
        } catch (e) { console.error("Error fetching totalPayments:", e.message); }

        if (startDate && endDate) {
            try {
                filteredPayments = await prisma.payment.aggregate({
                    _sum: { amount: true },
                    where: { 
                        ...dateFilter,
                        establishmentId: req.user.establishmentId
                    }
                });
            } catch (e) { console.error("Error fetching filteredPayments:", e.message); }
        }

        try {
            studentCount = await prisma.student.count({ 
                where: { 
                    status: 'ACTIF',
                    establishmentId: req.user.establishmentId
                } 
            });
        } catch (e) { console.error("Error fetching studentCount:", e.message); }

        try {
            classCount = await prisma.class.count({
                where: { establishmentId: req.user.establishmentId }
            });
        } catch (e) { console.error("Error fetching classCount:", e.message); }

        // If date filter is applied, 'revenueTotal' returns the filtered amount
        // Otherwise it returns the absolute total
        const displayTotal = (startDate && endDate)
            ? (filteredPayments?._sum?.amount || 0)
            : (totalPayments?._sum?.amount || 0);


        // Fetch last 7 days revenue for the chart
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayRev = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    paymentDate: { gte: date, lt: nextDate },
                    establishmentId: req.user.establishmentId
                }
            });

            last7Days.push({
                day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                amount: Number(dayRev._sum.amount) || 0
            });
        }

        res.json({
            revenueDay: Number(dayPayments?._sum?.amount) || 0,
            revenueMonth: Number(monthPayments?._sum?.amount) || 0,
            revenueTotal: Number(displayTotal) || 0,
            absoluteTotal: Number(totalPayments?._sum?.amount) || 0,
            stats: {
                students: studentCount || 0,
                classes: classCount || 0
            },
            chartData: last7Days
        });
    } catch (error) {
        console.error("Accounting Stats Global Error:", error);
        res.status(500).json({ 
            message: 'Erreur lors du calcul des statistiques', 
            error: error.message,
            stack: error.stack,
            context: { establishmentId: req.user?.establishmentId, role: req.user?.role }
        });
    }
});

const { calculateStudentFinancials } = require('../utils/finance');

// ... (other imports)

const XLSX = require('xlsx');

// @desc    Get debt report (Students with unpaid fees)
// @route   GET /api/accounting/debts
router.get('/debts', protect, authorize('ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { classId } = req.query;
        if (!req.user.establishmentId) {
            return res.json([]); 
        }

        const where = { 
            status: 'ACTIF',
            establishmentId: req.user.establishmentId
        };

        if (classId) {
            where.enrollments = { some: { classId: classId, schoolYear: { current: true } } };
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                enrollments: { include: { class: { include: { fees: true } } } },
                payments: true
            }
        });

        const report = students.map(s => {
            const enrollment = s.enrollments?.[0];
            if (!enrollment || !enrollment.class) return null;

            const fees = enrollment.class.fees || [];
            const payments = s.payments || [];

            try {
                const financials = calculateStudentFinancials(fees, payments);
                const { global, OBLIGATORY, OPTIONAL, OCCASIONAL } = financials;

                if (global.remaining <= 0) return null; // Only debtors

                return {
                    id: s.id,
                    name: `${s.firstName} ${s.lastName}`,
                    regNumber: s.regNumber,
                    className: enrollment.class.name,
                    totalFees: global.totalDue,
                    paid: global.totalPaid,
                    balance: global.remaining,
                    breakdown: {
                        obligatory: OBLIGATORY?.remaining || 0,
                        optional: OPTIONAL?.remaining || 0,
                        occasional: OCCASIONAL?.remaining || 0
                    }
                };
            } catch (err) {
                return null;
            }
        }).filter(r => r !== null);

        res.json(report);
    } catch (error) {
        console.error("Accounting Debts Global Error:", error);
        res.status(500).json({ message: 'Erreur lors du calcul des impayés', error: error.message });
    }
});

// @desc    Export debts to Excel
// @route   GET /api/accounting/debts/export
router.get('/debts/export', protect, authorize('ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { classId, search } = req.query;
        
        const where = { 
            status: 'ACTIF',
            establishmentId: req.user.establishmentId
        };

        if (classId) {
            where.enrollments = { some: { classId: classId, schoolYear: { current: true } } };
        }

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { regNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                enrollments: { include: { class: { include: { fees: true } } } },
                payments: true
            }
        });

        const reportData = students.map(s => {
            const enrollment = s.enrollments?.[0];
            if (!enrollment || !enrollment.class) return null;
            const financials = calculateStudentFinancials(enrollment.class.fees || [], s.payments || []);
            if (financials.global.remaining <= 0) return null;

            return {
                'Matricule': s.regNumber,
                'Nom': s.lastName.toUpperCase(),
                'Prénoms': s.firstName,
                'Classe': enrollment.class.name,
                'Total Dû': financials.global.totalDue,
                'Total Payé': financials.global.totalPaid,
                'Reste à Payer': financials.global.remaining,
                'Détail Obligatoire': financials.OBLIGATORY?.remaining || 0,
                'Détail Optionnel': financials.OPTIONAL?.remaining || 0
            };
        }).filter(r => r !== null);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Liste des Impayés');
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename=Impayes_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: 'Export Excel Error', error: error.message });
    }
});

// @desc    Get detailed PDF report
// @route   GET /api/accounting/report
router.get('/report', protect, authorize('ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!req.user.establishmentId) {
            return res.status(400).json({ message: 'Aucun établissement sélectionné' });
        }

        const establishment = await prisma.establishment.findUnique({
            where: { id: req.user.establishmentId }
        });

        // 1. Fetch Stats (Same logic as /stats)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const [totalPayments, monthPayments, filteredPayments] = await Promise.all([
            prisma.payment.aggregate({ _sum: { amount: true }, where: { establishmentId: req.user.establishmentId } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { paymentDate: { gte: startOfMonth }, establishmentId: req.user.establishmentId } }),
            (startDate && endDate) ? prisma.payment.aggregate({
                _sum: { amount: true },
                where: { 
                    paymentDate: { gte: new Date(startDate), lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) },
                    establishmentId: req.user.establishmentId
                }
            }) : Promise.resolve({ _sum: { amount: 0 } })
        ]);

        // 2. Fetch Debts (Same logic as /debts)
        const students = await prisma.student.findMany({
            where: { status: 'ACTIF', establishmentId: req.user.establishmentId },
            include: {
                enrollments: { include: { class: { include: { fees: true } } } },
                payments: true
            }
        });

        const debts = students.map(s => {
            const enrollment = s.enrollments?.[0];
            if (!enrollment || !enrollment.class) return null;
            const financials = calculateStudentFinancials(enrollment.class.fees || [], s.payments || []);
            return {
                name: `${s.firstName} ${s.lastName}`,
                className: enrollment.class.name,
                paid: financials.global.totalPaid,
                balance: financials.global.remaining
            };
        }).filter(d => d !== null && d.balance > 0);

        // Prepare report data
        const reportData = {
            establishmentName: establishment?.name || 'EDUSOFT',
            dateRange: { start: startDate, end: endDate },
            stats: {
                revenueTotal: (startDate && endDate) ? filteredPayments._sum.amount : totalPayments._sum.amount,
                revenueMonth: monthPayments._sum.amount
            },
            totalDebt: debts.reduce((acc, curr) => acc + curr.balance, 0),
            debts: debts
        };

        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Rapport_Comptable_${new Date().toISOString().split('T')[0]}.pdf`);

        // Generate and stream
        generateAccountingReport(reportData, res);

    } catch (error) {
        console.error("Accounting Report Error:", error);
        res.status(500).json({ message: 'Erreur lors de la génération du rapport', error: error.message });
    }
});

module.exports = router;
