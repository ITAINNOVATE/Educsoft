const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const est = await prisma.establishment.findUnique({ where: { code: 'ITA2026' } });
        console.log('Establishment ITA2026:', est ? 'FOUND' : 'NOT FOUND');
        
        const user = await prisma.user.findUnique({ where: { email: 'superadmin@edusoft.bj' } });
        console.log('SuperAdmin Account:', user ? 'FOUND' : 'NOT FOUND');
        
        if (user) {
            console.log('SuperAdmin Role:', user.role);
        }
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
