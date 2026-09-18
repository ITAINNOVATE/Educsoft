const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const est = await prisma.establishment.findFirst();
        if(!est) return console.log("No est");
        const estId = est.id;
        
        await prisma.$transaction(async (tx) => {
            await tx.grade.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.document.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.schoolHistory.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.parentStudent.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.enrollment.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.payment.deleteMany({ where: { establishmentId: estId } });
            await tx.fee.deleteMany({ where: { class: { establishmentId: estId } } });
            await tx.auditLog.deleteMany({ 
                where: { OR: [{ establishmentId: estId }, { user: { establishmentId: estId } }] } 
            });
            await tx.teacherPayment.deleteMany({ where: { establishmentId: estId } });
            
            // Try commenting out expense
            // await tx.expense.deleteMany({ where: { establishmentId: estId } });
            
            await tx.subject.deleteMany({ where: { establishmentId: estId } });
            await tx.term.deleteMany({ where: { schoolYear: { establishmentId: estId } } });
            await tx.class.deleteMany({ where: { establishmentId: estId } });
            await tx.schoolYear.deleteMany({ where: { establishmentId: estId } });
            await tx.student.deleteMany({ where: { establishmentId: estId } });
            await tx.parent.deleteMany({ where: { establishmentId: estId } });
            await tx.user.deleteMany({ where: { establishmentId: estId } });
            
            await tx.establishment.delete({ where: { id: estId } });
        });
        console.log("Success");
    } catch (e) {
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}
run();
