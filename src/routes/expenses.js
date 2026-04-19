const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure Multer for expense receipts
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/expenses';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `exp-${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// @desc    Get all expenses for the current establishment
// @route   GET /api/expenses
// @access  Private (Admin & Accountant)
router.get('/', protect, authorize(['ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { category, startDate, endDate } = req.query;
        
        const where = {
            establishmentId: req.user.establishmentId,
        };

        if (category) where.category = category;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' },
        });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
});

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (Admin & Accountant)
router.post('/', protect, authorize(['ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN']), upload.single('receipt'), async (req, res) => {
    try {
        const { description, amount, category, date, notes, method, spentBy } = req.body;

        if (!description || !amount || !category) {
            return res.status(400).json({ message: 'Please provide description, amount and category' });
        }

        let receiptUrl = null;
        if (req.file) {
            receiptUrl = `/uploads/expenses/${req.file.filename}`;
        }

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: parseFloat(amount),
                category,
                date: date ? new Date(date) : new Date(),
                notes,
                spentBy,
                method: method || 'CASH',
                receiptUrl,
                establishmentId: req.user.establishmentId,
                platformId: req.user.platformId
            }
        });

        res.status(201).json(expense);
    } catch (error) {
        console.error('Expense Creation Error:', error);
        res.status(500).json({ message: 'Error creating expense', error: error.message });
    }
});

// @desc    Get expense summary/stats
// @route   GET /api/expenses/stats
// @access  Private
router.get('/stats', protect, authorize(['ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTotal = await prisma.expense.aggregate({
            where: {
                establishmentId: req.user.establishmentId,
                date: { gte: startOfMonth }
            },
            _sum: { amount: true }
        });

        const categoryStats = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                establishmentId: req.user.establishmentId,
                date: { gte: startOfMonth }
            },
            _sum: { amount: true }
        });

        res.json({
            monthlyTotal: monthlyTotal._sum.amount || 0,
            categories: categoryStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const expense = await prisma.expense.findFirst({
            where: {
                id: req.params.id,
                establishmentId: req.user.establishmentId
            }
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await prisma.expense.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting expense', error: error.message });
    }
});

module.exports = router;
