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
    const { name, code, address, phone, email, type, typeOther, directorName } = req.body;

    try {
        const existing = await prisma.establishment.findUnique({ where: { code } });
        if (existing) {
            return res.status(400).json({ message: 'Ce code établissement est déjà utilisé.' });
        }

        const establishment = await prisma.establishment.create({
            data: { name, code, address, phone, email, type, typeOther, directorName }
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

// @desc    Update establishment (Status toggle)
// @route   PATCH /api/establishments/:id
// @access  Private (SUPER_ADMIN only)
router.patch('/:id', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { isActive, name, address, phone, email, type, typeOther, directorName } = req.body;

        const updateData = {};
        if (typeof isActive !== 'undefined') updateData.isActive = isActive;
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;
        if (type) updateData.type = type;
        if (typeof typeOther !== 'undefined') updateData.typeOther = typeOther;
        if (directorName) updateData.directorName = directorName;

        const establishment = await prisma.establishment.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(establishment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete establishment
// @route   DELETE /api/establishments/:id
// @access  Private (SUPER_ADMIN only)
router.delete('/:id', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        // Check if there are any students or users linked to this establishment
        const count = await prisma.establishment.findUnique({
            where: { id: req.params.id },
            include: {
                _count: {
                    select: { students: true, users: true }
                }
            }
        });

        if (count._count.students > 0 || count._count.users > 0) {
            return res.status(400).json({ 
                message: "Impossible de supprimer cet établissement car il contient encore des données (élèves ou agents).",
                details: `Veuillez d'abord supprimer les ${count._count.students} élèves et ${count._count.users} agents liés.`
            });
        }

        await prisma.establishment.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Établissement supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
