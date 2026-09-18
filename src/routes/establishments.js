const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all establishments
// @route   GET /api/establishments
// @access  Private (SUPER_ADMIN only)
router.get('/', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const establishments = await prisma.establishment.findMany({
            include: {
                _count: {
                    select: { students: true, users: true }
                }
            }
        });
        res.json(establishments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new establishment
// @route   POST /api/establishments
// @access  Private (SUPER_ADMIN only)
router.post('/', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    const { name, code, address, phone, email, type, typeOther, directorName, authorizationNum, educmasterNum } = req.body;

    try {
        const existing = await prisma.establishment.findUnique({ where: { code } });
        if (existing) {
            return res.status(400).json({ message: 'Ce code établissement est déjà utilisé.' });
        }

        const establishment = await prisma.establishment.create({
            data: { name, code, address, phone, email, type, typeOther, directorName, authorizationNum, educmasterNum }
        });

        res.status(201).json(establishment);
    } catch (error) {
        console.error("Establishment Creation Error:", error);
        res.status(500).json({
            message: 'Erreur lors de la création de l établissement',
            error: error.message
        });
    }
});

// @desc    Update establishment (Status toggle)
// @route   PATCH /api/establishments/:id
// @access  Private (SUPER_ADMIN only)
router.patch('/:id', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const { isActive, name, address, phone, email, type, typeOther, directorName, authorizationNum, educmasterNum } = req.body;

        const updateData = {};
        if (typeof isActive !== 'undefined') updateData.isActive = isActive;
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;
        if (type) updateData.type = type;
        if (typeof typeOther !== 'undefined') updateData.typeOther = typeOther;
        if (directorName) updateData.directorName = directorName;
        if (typeof authorizationNum !== 'undefined') updateData.authorizationNum = authorizationNum;
        if (typeof educmasterNum !== 'undefined') updateData.educmasterNum = educmasterNum;

        const establishment = await prisma.establishment.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(establishment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete establishment
// @route   DELETE /api/establishments/:id
// @access  Private (SUPER_ADMIN only)
router.delete('/:id', protect, authorize('SUPER_ADMIN'), async (req, res) => {
    try {
        const estId = req.params.id;

        await prisma.$transaction(async (tx) => {
            // Grades (depend on student, subject, term)
            await tx.grade.deleteMany({ where: { student: { establishmentId: estId } } });
            
            // Documents, SchoolHistory, ParentStudent, Enrollments, Payments (depend on student or establishment)
            await tx.document.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.schoolHistory.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.parentStudent.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.enrollment.deleteMany({ where: { student: { establishmentId: estId } } });
            await tx.payment.deleteMany({ where: { establishmentId: estId } });
            
            // Fees (depend on class)
            await tx.fee.deleteMany({ where: { class: { establishmentId: estId } } });
            
            // AuditLogs (depend on establishment or user in establishment)
            await tx.auditLog.deleteMany({ 
                where: { 
                    OR: [
                        { establishmentId: estId }, 
                        { user: { establishmentId: estId } }
                    ] 
                } 
            });
            
            // TeacherPayments & Expenses (depend on establishment)
            await tx.teacherPayment.deleteMany({ where: { establishmentId: estId } });
            // NOTE: expense table in DB doesn't have establishment_id column, so we skip it to prevent Prisma errors
            // await tx.expense.deleteMany({ where: { establishmentId: estId } });
            
            // Subjects & Terms (depend on establishment or schoolYear)
            await tx.subject.deleteMany({ where: { establishmentId: estId } });
            await tx.term.deleteMany({ where: { schoolYear: { establishmentId: estId } } });
            
            // Classes & SchoolYears (depend on establishment)
            await tx.class.deleteMany({ where: { establishmentId: estId } });
            await tx.schoolYear.deleteMany({ where: { establishmentId: estId } });
            
            // Students, Parents & Users (depend on establishment)
            await tx.student.deleteMany({ where: { establishmentId: estId } });
            await tx.parent.deleteMany({ where: { establishmentId: estId } });
            await tx.user.deleteMany({ where: { establishmentId: estId } });
            
            // Finally, delete the establishment itself
            await tx.establishment.delete({ where: { id: estId } });
        }, {
            maxWait: 5000,
            timeout: 30000 // 30 seconds to prevent timeout on slow connections
        });

        res.json({ message: 'Établissement et toutes ses données associées ont été supprimés avec succès' });
    } catch (error) {
        console.error("Delete establishment error:", error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'établissement', details: error.message });
    }
});

module.exports = router;
