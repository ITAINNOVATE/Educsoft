const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Reset and Admin Recreation ---');

    // 1. Delete all data in correct order
    await prisma.auditLog.deleteMany({});
    await prisma.teacherPayment.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.schoolHistory.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.parentStudent.deleteMany({});
    await prisma.fee.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.schoolYear.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.parent.deleteMany({});
    await prisma.user.deleteMany({});

    // 2. Re-create Default Admin Users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedPasswordCompta = await bcrypt.hash('compta123', 10);
    const hashedPasswordSecret = await bcrypt.hash('secret123', 10);

    await prisma.user.create({
        data: { email: 'admin', password: hashedPassword, firstName: 'Admin', lastName: 'Principal', role: 'ADMIN' }
    });
    await prisma.user.create({
        data: { email: 'comptable', password: hashedPasswordCompta, firstName: 'Comptable', lastName: 'Finance', role: 'ACCOUNTANT' }
    });
    await prisma.user.create({
        data: { email: 'secretaire', password: hashedPasswordSecret, firstName: 'Secrétaire', lastName: 'Inscription', role: 'SECRETARY' }
    });

    console.log('--- Cleanup Successful ---');
}

main()
    .catch((e) => {
        console.error('Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
