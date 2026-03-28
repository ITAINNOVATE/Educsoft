// CLEANUP ROUTE - TEMPORARY - TO BE DELETED AFTER USE
// Supprime les deux écoles de démo (CREUSET et LES MERVEILLES)
// Accessible via: GET /api/cleanup-demo-schools?secret=ITA_CLEANUP_2026

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SCHOOL_IDS = [
    '7ce8166a-c90d-49ca-92b3-2983008e1127', // CREUSET DU SAVOIR
    'b4d7f9d6-c495-4415-a67d-74e0c8dc4ea7',  // ECOLE PRIVEE LES MERVEILLES
];

const ITA_ID = '809c17d7-5a93-4b69-81c5-f080ce4126a3';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Security gate
    if (req.query.secret !== 'ITA_CLEANUP_2026') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const log = [];

    try {
        for (const schoolId of SCHOOL_IDS) {
            // Verify it's not ITA
            if (schoolId === ITA_ID) {
                log.push(`SKIPPING ITA (protected)`);
                continue;
            }

            log.push(`--- Cleaning school ${schoolId} ---`);

            const auditDel = await prisma.auditLog.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`AuditLog deleted: ${auditDel.count}`);

            const tpDel = await prisma.teacherPayment.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`TeacherPayment deleted: ${tpDel.count}`);

            const payDel = await prisma.payment.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`Payment deleted: ${payDel.count}`);

            // Get student IDs for this school
            const students = await prisma.student.findMany({
                where: { establishmentId: schoolId },
                select: { id: true }
            });
            const studentIds = students.map(s => s.id);

            if (studentIds.length > 0) {
                const enrollDel = await prisma.enrollment.deleteMany({ where: { studentId: { in: studentIds } } });
                log.push(`Enrollment deleted: ${enrollDel.count}`);

                const psDel = await prisma.parentStudent.deleteMany({ where: { studentId: { in: studentIds } } });
                log.push(`ParentStudent deleted: ${psDel.count}`);

                const docDel = await prisma.document.deleteMany({ where: { studentId: { in: studentIds } } });
                log.push(`Document deleted: ${docDel.count}`);

                const shDel = await prisma.schoolHistory.deleteMany({ where: { studentId: { in: studentIds } } });
                log.push(`SchoolHistory deleted: ${shDel.count}`);
            }

            const stuDel = await prisma.student.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`Student deleted: ${stuDel.count}`);

            const parDel = await prisma.parent.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`Parent deleted: ${parDel.count}`);

            // Get class IDs for this school
            const classes = await prisma.class.findMany({
                where: { establishmentId: schoolId },
                select: { id: true }
            });
            const classIds = classes.map(c => c.id);

            if (classIds.length > 0) {
                const feeDel = await prisma.fee.deleteMany({ where: { classId: { in: classIds } } });
                log.push(`Fee deleted: ${feeDel.count}`);
            }

            const classDel = await prisma.class.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`Class deleted: ${classDel.count}`);

            const syDel = await prisma.schoolYear.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`SchoolYear deleted: ${syDel.count}`);

            const userDel = await prisma.user.deleteMany({ where: { establishmentId: schoolId } });
            log.push(`User deleted: ${userDel.count}`);

            const estDel = await prisma.establishment.delete({ where: { id: schoolId } });
            log.push(`✅ Establishment DELETED: ${estDel.name}`);
        }

        // Final verification
        const remaining = await prisma.establishment.findMany({ select: { id: true, name: true, code: true } });
        log.push('--- FINAL STATE ---');
        log.push(`Remaining establishments: ${remaining.length}`);

        return res.status(200).json({
            success: true,
            log,
            remaining
        });

    } catch (error) {
        log.push(`ERROR: ${error.message}`);
        return res.status(500).json({ success: false, log, error: error.message });
    } finally {
        await prisma.$disconnect();
    }
};
