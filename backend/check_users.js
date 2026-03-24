const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        select: { email: true, role: true, firstName: true }
    });
    console.log('--- USERS IN DB ---');
    users.forEach(u => console.log(`- ${u.email} (${u.role})` || 'No users found'));
}

check().finally(() => prisma.$disconnect());
