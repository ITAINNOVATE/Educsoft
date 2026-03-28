const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const where = req.user.role === 'SUPER_ADMIN' ? {} : { establishmentId: req.user.establishmentId };
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                lastLogin: true,
                createdAt: true,
                establishment: { select: { name: true, code: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin only)
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN'), auditLog('CREATE_USER'), async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    // Security: Only Super Admin can create an ADMIN role
    if (role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Seul un Super Admin peut désigner un Administrateur.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                establishmentId: req.user.establishmentId
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), auditLog('UPDATE_USER'), async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    try {
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        
        if (role) {
            // Security: Only Super Admin can promote someone to ADMIN
            if (role === 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Modification refusée. Seul un Super Admin peut accorder le rôle Administrateur.' });
            }
            updateData.role = role;
        }
        
        if (email) {
            const existingUser = await prisma.user.findFirst({
                where: { email, id: { not: req.params.id } }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use by another account.' });
            }
            updateData.email = email;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const where = req.user.role === 'SUPER_ADMIN' ? { id: req.params.id } : { id: req.params.id, establishmentId: req.user.establishmentId };
        
        const user = await prisma.user.update({
            where,
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), auditLog('DELETE_USER'), async (req, res) => {
    try {
        // Prevent deleting oneself
        const where = req.user.role === 'SUPER_ADMIN' ? { id: req.params.id } : { id: req.params.id, establishmentId: req.user.establishmentId };
        
        await prisma.user.delete({ where });
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
