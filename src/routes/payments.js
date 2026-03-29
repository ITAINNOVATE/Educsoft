const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// --- Fee Configuration ---

// @desc    Configure fees for a class
// @route   POST /api/payments/fees
router.post('/fees', protect, authorize('ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), auditLog('CREATE_FEE'), async (req, res) => {
    const { name, amount, category, type, classId } = req.body;
    try {
        // Verify class belongs to establishment
        const targetClass = await prisma.class.findFirst({
            where: { id: classId, establishmentId: req.user.establishmentId }
        });
        if (!targetClass) return res.status(404).json({ message: 'Classe non trouvée dans cet établissement.' });

        const fee = await prisma.fee.create({
            data: {
                name,
                amount: parseFloat(amount),
                category: category || 'ANNUAL_OBLIGATORY',
                type: type || 'TUITION',
                classId
            }
        });
        res.status(201).json(fee);
    } catch (error) {
        res.status(500).json({ message: 'Error creating fee', error: error.message });
    }
});

// @desc    Get fees for a class
// @route   GET /api/payments/fees/:classId
router.get('/fees/:classId', protect, async (req, res) => {
    try {
        const fees = await prisma.fee.findMany({
            where: { 
                classId: req.params.classId,
                class: { establishmentId: req.user.establishmentId }
            }
        });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Update a fee
// @route   PUT /api/payments/fees/:id
router.put('/fees/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), auditLog('UPDATE_FEE'), async (req, res) => {
    const { name, amount, category, type } = req.body;
    try {
        const fee = await prisma.fee.update({
            where: { 
                id: req.params.id,
                class: { establishmentId: req.user.establishmentId }
            },
            data: {
                name,
                amount: parseFloat(amount),
                category,
                type
            }
        });
        res.json(fee);
    } catch (error) {
        res.status(500).json({ message: 'Error updating fee', error: error.message });
    }
});

// @desc    Delete a fee
// @route   DELETE /api/payments/fees/:id
router.delete('/fees/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), auditLog('DELETE_FEE'), async (req, res) => {
    try {
        await prisma.fee.delete({
            where: { 
                id: req.params.id,
                class: { establishmentId: req.user.establishmentId }
            }
        });
        res.json({ message: 'Fee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting fee', error: error.message });
    }
});

// --- Payment Processing ---

// @desc    Process a student payment
// @route   POST /api/payments
router.post('/', protect, authorize('ADMIN', 'ACCOUNTANT', 'SECRETARY', 'SUPER_ADMIN'), auditLog('PROCESS_PAYMENT'), async (req, res) => {
    const { studentId, amount, method, notes, feeId, feeName } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const receiptCount = await tx.payment.count({ where: { establishmentId: req.user.establishmentId } });
            const receiptNumber = `REC-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(5, '0')}`;

            const payment = await tx.payment.create({
                data: {
                    studentId,
                    feeId,
                    feeName,
                    amount: parseFloat(amount),
                    method,
                    notes,
                    receiptNumber,
                    paymentDate: new Date(),
                    establishmentId: req.user.establishmentId
                }
            });

            return payment;
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
});

// @desc    Get all payments (Journal de Caisse) (paginated)
// @route   GET /api/payments
router.get('/', protect, authorize('ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'), async (req, res) => {
    const { startDate, endDate, method } = req.query;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;

        const where = { establishmentId: req.user.establishmentId };
        
        if (startDate || endDate) {
            where.paymentDate = {};
            if (startDate) where.paymentDate.gte = new Date(startDate);
            if (endDate) where.paymentDate.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }
        
        if (method) where.method = method;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: { 
                    student: { 
                        include: { 
                            enrollments: { 
                                where: { status: 'VALIDATED' },
                                include: { class: { include: { fees: true } } },
                                take: 1
                            },
                            payments: true // Needed for balance calculation in detail view
                        } 
                    } 
                },
                orderBy: { paymentDate: 'desc' },
                skip,
                take: limit
            }),
            prisma.payment.count({ where })
        ]);

        res.json({
            payments,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching journal', error: error.message });
    }
});

// @desc    Get payment history for a student

const { generateReceiptPDF } = require('../utils/receipt');

// @desc    Download receipt PDF
// @route   GET /api/payments/receipt/:paymentId
router.get('/receipt/:paymentId', protect, async (req, res) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: { 
                id: req.params.paymentId,
                establishmentId: req.user.establishmentId
            },
            include: {
                student: {
                    include: {
                        enrollments: { include: { class: true } }
                    }
                }
            }
        });

        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        // Calculate financials for the receipt
        const enrollment = payment.student.enrollments[0];
        const fees = enrollment?.class?.fees || [];
        // We need all payments for this student to calculate the remaining balance
        const allPayments = await prisma.payment.findMany({
            where: { studentId: payment.studentId }
        });

        const financials = calculateStudentFinancials(fees, allPayments);
        payment.student.financials = financials;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.receiptNumber}.pdf`);

        generateReceiptPDF(payment, payment.student, res);
    } catch (error) {
        res.status(500).json({ message: 'Error generating receipt', error: error.message });
    }
});

const { calculateStudentFinancials } = require('../utils/finance');

// ... (existing imports)

// @desc    Search students for payment (autocomplete)
// @route   GET /api/payments/search-students
router.get('/search-students', protect, async (req, res) => {
    const { q, classId } = req.query;
    if (!q && !classId) return res.json([]);

    try {
        const where = {};
        if (q && q.length >= 2) {
            where.OR = [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { regNumber: { contains: q, mode: 'insensitive' } }
            ];
        } else if (q && q.length < 2 && !classId) {
            return res.json([]);
        }

        if (classId) {
            where.enrollments = {
                some: {
                    classId: classId,
                    status: 'VALIDATED'
                }
            };
        }

        const students = await prisma.student.findMany({
            where: { 
                ...where,
                establishmentId: req.user.establishmentId
            },
            include: {
                enrollments: {
                    include: { class: { include: { fees: true } } },
                    where: { status: 'VALIDATED' },
                    take: 1
                },
                payments: true
            },
            take: 30
        });

        const results = students.map(s => {
            const enrollment = s.enrollments[0];
            const fees = enrollment?.class?.fees || [];
            const payments = s.payments || [];

            const financials = calculateStudentFinancials(fees, payments);

            return {
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                regNumber: s.regNumber,
                class: enrollment?.class?.name,
                classId: enrollment?.class?.id,
                fees: fees,
                financials: financials.global, // Using the 'global' part from finance.js which matches expected structure
                groupedFees: {
                    OBLIGATORY: financials.OBLIGATORY.details,
                    OPTIONAL: financials.OPTIONAL.details,
                    OCCASIONAL: financials.OCCASIONAL.details
                }
            };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error searching students', error: error.message });
    }
});

// @desc    Get daily summary
// @route   GET /api/payments/daily-summary
router.get('/daily-summary', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const payments = await prisma.payment.findMany({
            where: {
                paymentDate: { gte: today },
                establishmentId: req.user.establishmentId
            },
            include: { student: true }
        });

        const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

        res.json({
            totalRevenue,
            count: payments.length,
            transactions: payments
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching daily summary', error: error.message });
    }
});

// @desc    Get all payments (paginated)
// @route   GET /api/payments/student/all
router.get('/student/all', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where: { establishmentId: req.user.establishmentId },
                include: { student: { include: { enrollments: { include: { class: true } } } } },
                orderBy: { paymentDate: 'desc' },
                skip,
                take: limit
            }),
            prisma.payment.count({ where: { establishmentId: req.user.establishmentId } })
        ]);

        res.json({
            payments,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
