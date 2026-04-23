const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// @desc    Get all users (optionally filtered by establishmentId for SUPER_ADMIN)
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('ADMIN', 'SUPER_ADMIN', 'FOUNDER'), async (req, res) => {
    try {
        let where;
        if (req.user.role === 'SUPER_ADMIN') {
            // Priority 1: explicit ?establishmentId query param (from EstablishmentUsers page)
            // Priority 2: active establishment context from the JWT (MODE GESTION)
            // Priority 3: no filter (show all) when no context
            const filterById = req.query.establishmentId || req.user.establishmentId || null;
            where = filterById ? { establishmentId: filterById } : {};
        } else {
            where = { establishmentId: req.user.establishmentId };
        }
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
router.post('/', protect, authorize('ADMIN', 'SUPER_ADMIN', 'FOUNDER'), auditLog('CREATE_USER'), async (req, res) => {
    const { firstName, lastName, email, password, role, establishmentId: bodyEstablishmentId } = req.body;

    // Security: Only Super Admin can create an ADMIN or FOUNDER role
    if ((role === 'ADMIN' || role === 'FOUNDER') && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Seul un Super Admin peut désigner un Administrateur ou un Fondateur.' });
    }

    // Determine which establishment to assign the new user to
    const targetEstablishmentId = (req.user.role === 'SUPER_ADMIN' && bodyEstablishmentId)
        ? bodyEstablishmentId
        : req.user.establishmentId;

    try {
        // Check if this email already exists in THIS establishment (not globally)
        const existingUser = await prisma.user.findFirst({
            where: { email, establishmentId: targetEstablishmentId }
        });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Un utilisateur avec cet email existe déjà dans cet établissement.' 
            });
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
                establishmentId: targetEstablishmentId
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
        console.error('CREATE_USER error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN', 'FOUNDER'), auditLog('UPDATE_USER'), async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    try {
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        
        if (role) {
            // Security: Only Super Admin can promote someone to ADMIN or FOUNDER
            if ((role === 'ADMIN' || role === 'FOUNDER') && req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Modification refusée. Seul un Super Admin peut accorder le rôle Administrateur ou Fondateur.' });
            }
            updateData.role = role;
        }
        
        if (email) {
            // Check uniqueness per establishment only
            const targetEstId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.establishmentId;
            const existingUser = await prisma.user.findFirst({
                where: {
                    email,
                    id: { not: req.params.id },
                    ...(targetEstId ? { establishmentId: targetEstId } : {})
                }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Email déjà utilisé par un autre compte dans cet établissement.' });
            }
            updateData.email = email;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // For non-SUPER_ADMIN: verify the user belongs to their establishment before updating
        if (req.user.role !== 'SUPER_ADMIN') {
            const targetUser = await prisma.user.findFirst({
                where: { id: req.params.id, establishmentId: req.user.establishmentId }
            });
            if (!targetUser) {
                return res.status(404).json({ message: 'Utilisateur introuvable dans cet établissement.' });
            }
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
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
        console.error('UPDATE_USER error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN', 'SUPER_ADMIN', 'FOUNDER'), auditLog('DELETE_USER'), async (req, res) => {
    try {
        // For non-SUPER_ADMIN: verify the user belongs to their establishment first
        if (req.user.role !== 'SUPER_ADMIN') {
            const targetUser = await prisma.user.findFirst({
                where: { id: req.params.id, establishmentId: req.user.establishmentId }
            });
            if (!targetUser) {
                return res.status(404).json({ message: 'Utilisateur introuvable dans cet établissement.' });
            }
        }

        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: 'User removed' });
    } catch (error) {
        console.error('DELETE_USER error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

module.exports = router;
