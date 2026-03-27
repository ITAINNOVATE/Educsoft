const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all establishments
// @route   GET /api/establishments
// @access  Private (SUPER_ADMIN only)
router.get('/', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const establishments = await prisma.establishment.findMany({
            include: {
                _count: {
                    select: { students: true, users: true }
                }
            }
        });
        res.json(establishments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new establishment
// @route   POST /api/establishments
// @access  Private (SUPER_ADMIN only)
router.post('/', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    const { name, code, address, phone, email } = req.body;

    try {
        const exists = await prisma.establishment.findUnique({ where: { code } });
        if (exists) {
            return res.status(400).json({ message: 'Code établissement déjà utilisé' });
        }

        const establishment = await prisma.establishment.create({
            data: { name, code, address, phone, email }
        });

        res.status(201).json(establishment);
    } catch (error) {
        console.error("Establishment Creation Error:", error);
        res.status(500).json({ 
            message: 'Erreur lors de la création de l établissement', 
            error: error.message 
        });
    }
});

module.exports = router;
