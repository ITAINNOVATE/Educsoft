const express = require('express');
const { prisma } = require('../context');
const router = express.Router();

router.get('/data', async (req, res) => {
    try {
        const estCount = await prisma.establishment.count();
        const userCount = await prisma.user.count();
        const ita = await prisma.establishment.findUnique({ where: { code: 'ITA2026' } });
        const superadmin = await prisma.user.findUnique({ where: { email: 'superadmin@edusoft.bj' } });

        res.json({
            status: 'success',
            stats: {
                establishments: estCount,
                users: userCount
            },
            verified: {
                establishment_ITA2026: !!ita,
                superadmin_account: !!superadmin,
                superadmin_role: superadmin?.role
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
