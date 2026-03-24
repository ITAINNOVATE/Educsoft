const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Database Seeding (DEMO MODE) ---');

    // 1. Clear existing data in correct order
    await prisma.auditLog.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.enrollment.deleteMany({});
    await prisma.parentStudent.deleteMany({});
    await prisma.fee.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.schoolYear.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.parent.deleteMany({});
    await prisma.user.deleteMany({});

    // 2. Create Three Admin Users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedPasswordCompta = await bcrypt.hash('compta123', 10);
    const hashedPasswordSecret = await bcrypt.hash('secret123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'Principal',
            role: 'ADMIN',
        },
    });

    const comptable = await prisma.user.create({
        data: {
            email: 'comptable',
            password: hashedPasswordCompta,
            firstName: 'Comptable',
            lastName: 'Finance',
            role: 'ACCOUNTANT',
        },
    });

    const secretaire = await prisma.user.create({
        data: {
            email: 'secretaire',
            password: hashedPasswordSecret,
            firstName: 'Secrétaire',
            lastName: 'Inscription',
            role: 'SECRETARY',
        },
    });

    // 3. School Year
    const schoolYear = await prisma.schoolYear.create({
        data: {
            name: '2025-2026',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-06-30'),
            current: true
        }
    });

    // 4. Classes Configuration
    const classConfigs = [
        { name: 'Maternelle 1', level: 'MATERNELLE', baseFees: 100000 },
        { name: 'Maternelle 2', level: 'MATERNELLE', baseFees: 110000 },
        { name: 'CI', level: 'PRIMAIRE', baseFees: 125000 },
        { name: 'CP', level: 'PRIMAIRE', baseFees: 130000 },
        { name: 'CE1', level: 'PRIMAIRE', baseFees: 140000 },
        { name: 'CE2', level: 'PRIMAIRE', baseFees: 150000 },
        { name: 'CM1', level: 'PRIMAIRE', baseFees: 160000 },
        { name: 'CM2', level: 'PRIMAIRE', baseFees: 175000 },
        { name: '6ème', level: 'COLLEGE', baseFees: 220000 },
        { name: '5ème', level: 'COLLEGE', baseFees: 230000 },
        { name: '4ème', level: 'COLLEGE', baseFees: 240000 },
        { name: '3ème', level: 'COLLEGE', baseFees: 260000 }
    ];

    const createdClasses = [];
    for (const c of classConfigs) {
        const classObj = await prisma.class.create({
            data: {
                name: c.name,
                level: c.level,
                schoolYearId: schoolYear.id,
                fees: {
                    create: [
                        { name: 'Inscription / Réinscription', amount: 35000, category: 'ANNUAL_OBLIGATORY', type: 'REGISTRATION' },
                        { name: 'Scolarité Annuelle', amount: c.baseFees, category: 'ANNUAL_OBLIGATORY', type: 'TUITION' },
                        { name: 'Transport Scolaire (Trimestre)', amount: 45000, category: 'OPTIONAL', type: 'TRANSPORT' },
                        { name: 'Cantine (Mois)', amount: 25000, category: 'OPTIONAL', type: 'CANTEEN' },
                        { name: 'Frais d\'Examen', amount: 15000, category: 'OCCASIONAL', type: 'EXAM' },
                        { name: 'Tenue de Sport', amount: 12500, category: 'OCCASIONAL', type: 'UNIFORM' }
                    ]
                }
            },
            include: { fees: true }
        });
        createdClasses.push(classObj);
    }

    // 5. Students & Parents (Deep Demo Data)
    const mockStudents = [
        { first: 'Abdoulaye', last: 'DIOP', reg: 'STU20250001', classIdx: 1, payStatus: 'PAID' },
        { first: 'Saliou', last: 'GUEYE', reg: 'STU20250002', classIdx: 1, payStatus: 'PARTIAL' },
        { first: 'Awa', last: 'N\'DIAYE', reg: 'STU20250003', classIdx: 2, payStatus: 'DEBT' },
        { first: 'Mamadou', last: 'FALL', reg: 'STU20250004', classIdx: 3, payStatus: 'PAID' },
        { first: 'Khadija', last: 'SARR', reg: 'STU20250005', classIdx: 4, payStatus: 'PARTIAL' },
        { first: 'Christian', last: 'DOSSOU', reg: 'STU20250006', classIdx: 4, payStatus: 'DEBT' },
        { first: 'Rokia', last: 'TRAORE', reg: 'STU20250007', classIdx: 5, payStatus: 'PAID' },
        { first: 'Ousmane', last: 'MANE', reg: 'STU20250008', classIdx: 0, payStatus: 'PARTIAL' },
        { first: 'Fatoumata', last: 'BARRY', reg: 'STU20250009', classIdx: 2, payStatus: 'DEBT' },
        { first: 'Issa', last: 'COULIBALY', reg: 'STU20250010', classIdx: 3, payStatus: 'PAID' }
    ];

    for (const [idx, s] of mockStudents.entries()) {
        const targetClass = createdClasses[s.classIdx];
        const student = await prisma.student.create({
            data: {
                regNumber: s.reg,
                firstName: s.first,
                lastName: s.last,
                dob: new Date('2014-03-20'),
                pob: 'Cotonou',
                gender: idx % 2 === 0 ? 'M' : 'F',
                address: 'Cité Keur Gorgui, Villa ' + (100 + idx),
                nationality: 'Béninoise',
                enrollments: {
                    create: {
                        classId: targetClass.id,
                        schoolYearId: schoolYear.id,
                        status: 'VALIDATED'
                    }
                },
                parents: {
                    create: {
                        parent: {
                            create: {
                                firstName: 'Parent de ' + s.first,
                                lastName: s.last,
                                phonePrimary: '+221 70 800 90 ' + String(idx).padStart(2, '0'),
                                address: 'Même que l\'élève'
                            }
                        },
                        relation: 'PERE',
                        isPrimary: true
                    }
                }
            }
        });

        // 6. Realistic Payment Data based on payStatus
        const obligFees = targetClass.fees.filter(f => f.category === 'ANNUAL_OBLIGATORY');
        const optFees = targetClass.fees.filter(f => f.category === 'OPTIONAL');

        if (s.payStatus === 'PAID') {
            // Paid all obligatory and some optional
            for (const f of obligFees) {
                await prisma.payment.create({
                    data: {
                        studentId: student.id,
                        feeId: f.id,
                        feeName: f.name,
                        amount: f.amount,
                        method: 'BANK_TRANSFER',
                        receiptNumber: `REC-${s.reg}-FULL-${f.type}`,
                        paymentDate: new Date()
                    }
                });
            }
        } else if (s.payStatus === 'PARTIAL') {
            // Paid registration but only half of tuition
            const regFee = obligFees.find(f => f.type === 'REGISTRATION');
            const tuitionFee = obligFees.find(f => f.type === 'TUITION');

            if (regFee) {
                await prisma.payment.create({
                    data: { studentId: student.id, feeId: regFee.id, feeName: regFee.name, amount: regFee.amount, method: 'CASH', receiptNumber: `REC-${s.reg}-REG`, paymentDate: new Date() }
                });
            }
            if (tuitionFee) {
                await prisma.payment.create({
                    data: { studentId: student.id, feeId: tuitionFee.id, feeName: tuitionFee.name, amount: tuitionFee.amount / 2, method: 'CASH', receiptNumber: `REC-${s.reg}-TUITION-P1`, paymentDate: new Date() }
                });
            }
        }
        // DEBT status = No payments recorded
    }

    console.log('--- Seeding Completed successfully ---');
    console.log('Admin Principal: admin / admin123');
    console.log('Comptable: comptable / compta123');
    console.log('Secrétaire: secretaire / secret123');
    console.log(`${mockStudents.length} Students created with mock debts.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
