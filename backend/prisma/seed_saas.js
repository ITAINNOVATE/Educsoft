const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING SAAS SEEDING ---');

    // 1. Create Default Establishment
    const establishment = await prisma.establishment.upsert({
        where: { code: 'ITA2026' },
        update: {},
        create: {
            name: 'INSTITUT DE TECHNOLOGIE APPLIQUÉE (ITA)',
            code: 'ITA2026',
            address: 'Cotonou, Bénin',
            phone: '+229 0100000000',
            email: 'contact@ita.bj',
            isActive: true
        }
    });
    console.log('✅ Establishment Created:', establishment.name);

    // 2. Create Super Admin
    const hashedSuperPassword = await bcrypt.hash('Admin@2026', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@edusoft.bj' },
        update: {},
        create: {
            email: 'superadmin@edusoft.bj',
            password: hashedSuperPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN'
            // establishmentId: null (System level)
        }
    });
    console.log('✅ Super Admin Created:', superAdmin.email);

    // 3. Create Establishment Admin
    const hashedAdminPassword = await bcrypt.hash('Admin@2026', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@edusoft.bj' },
        update: {},
        create: {
            email: 'admin@edusoft.bj',
            password: hashedAdminPassword,
            firstName: 'Admin',
            lastName: 'ITA',
            role: 'ADMIN',
            establishmentId: establishment.id
        }
    });
    console.log('✅ Establishment Admin Created:', admin.email);

    // 4. Create dummy school year for the establishment
    const schoolYear = await prisma.schoolYear.upsert({
        where: { 
            name_establishmentId: {
                name: '2025-2026',
                establishmentId: establishment.id
            }
        },
        update: {},
        create: {
            name: '2025-2026',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-07-31'),
            current: true,
            establishmentId: establishment.id
        }
    });
    console.log('✅ School Year Created:', schoolYear.name);

    console.log('--- SEEDING COMPLETED ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
