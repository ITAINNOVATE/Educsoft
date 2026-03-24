const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function check() {
    const admin = await prisma.user.findUnique({ where: { email: 'admin' } });
    if (!admin) {
        console.log('User admin not found');
        return;
    }
    const isMatch = await bcrypt.compare('admin123', admin.password);
    console.log('Login admin / admin123 match:', isMatch);

    const compta = await prisma.user.findUnique({ where: { email: 'comptable' } });
    const isMatchCompta = await bcrypt.compare('compta123', compta.password);
    console.log('Login comptable / compta123 match:', isMatchCompta);
}

check().finally(() => prisma.$disconnect());
