const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../context');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password, establishmentCode } = req.body;

    if (!establishmentCode) {
        return res.status(400).json({ message: 'Code établissement requis' });
    }

    try {
        // 1. Check Establishment
        const establishment = await prisma.establishment.findUnique({
            where: { code: establishmentCode }
        });

        if (!establishment) {
            return res.status(404).json({ message: 'Établissement non trouvé' });
        }

        // 2. Find User
        // Priority 1: User in this establishment
        // Priority 2: Super Admin (can login to any establishment)
        let user = await prisma.user.findFirst({ 
            where: { 
                email: { equals: email, mode: 'insensitive' },
                OR: [
                    { establishmentId: establishment.id },
                    { role: 'SUPER_ADMIN' }
                ]
            } 
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Update last login (fire and forget / safe update)
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                });
            } catch (updateError) {
                console.error("Failed to update lastLogin:", updateError);
                // Continue with login even if date update fails
            }

            res.json({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                establishmentId: user.role === 'SUPER_ADMIN' ? establishment.id : user.establishmentId,
                establishmentName: establishment.name,
                token: jwt.sign(
                    { 
                        id: user.id, 
                        establishmentId: user.role === 'SUPER_ADMIN' ? establishment.id : user.establishmentId 
                    }, 
                    process.env.JWT_SECRET, 
                    { expiresIn: '30d' }
                ),
            });
        } else {
            console.warn(`Failed login attempt for email: ${email}`);
            res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error("Login Server Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Switch active establishment (SUPER_ADMIN only)
// @route   POST /api/auth/switch-establishment
// @access  Private (SUPER_ADMIN only)
router.post('/switch-establishment', protect, async (req, res) => {
    const { establishmentId } = req.body;

    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Accès refusé. Réservé aux Super Admin.' });
    }

    try {
        const establishment = await prisma.establishment.findUnique({
            where: { id: establishmentId }
        });

        if (!establishment) {
            return res.status(404).json({ message: 'Établissement non trouvé' });
        }

        const newToken = jwt.sign(
            { id: req.user.id, establishmentId: establishment.id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            role: req.user.role,
            establishmentId: establishment.id,
            establishmentName: establishment.name,
            token: newToken
        });
    } catch (error) {
        console.error("Switch Establishment Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Get user profile

module.exports = router;
