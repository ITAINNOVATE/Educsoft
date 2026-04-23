const express = require('express');
const { prisma } = require('../context');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get dashboard summary statistics based on user role
// @route   GET /api/dashboard/summary
router.get('/summary', protect, async (req, res) => {
    try {
        const { establishmentId, role } = req.user;

        if (!establishmentId && role !== 'SUPER_ADMIN') {
            return res.status(400).json({ message: 'Établissement non spécifié.' });
        }

        // --- COMMON DATA (for everyone) ---
        const [studentCount, classCount] = await Promise.all([
            prisma.student.count({ where: { establishmentId, status: 'ACTIF' } }),
            prisma.class.count({ where: { establishmentId } })
        ]);

        const responseData = {
            role,
            totals: {
                students: studentCount,
                classes: classCount
            }
        };

        // --- ROLE SPECIFIC LOGIC ---

        // 1. MANAGEMENT ROLES (Admin, Accountant, Founder, Super Admin)
        if (['ADMIN', 'ACCOUNTANT', 'FOUNDER', 'SUPER_ADMIN'].includes(role)) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const [revenueMonth, revenueTotal, recentPayments] = await Promise.all([
                prisma.payment.aggregate({
                    _sum: { amount: true },
                    where: { establishmentId, paymentDate: { gte: startOfMonth } }
                }),
                prisma.payment.aggregate({
                    _sum: { amount: true },
                    where: { establishmentId }
                }),
                prisma.payment.findMany({
                    where: { establishmentId },
                    take: 5,
                    orderBy: { paymentDate: 'desc' },
                    include: { student: { select: { firstName: true, lastName: true } } }
                })
            ]);

            // Chart data (last 7 days)
            const chartData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const daySum = await prisma.payment.aggregate({
                    _sum: { amount: true },
                    where: { establishmentId, paymentDate: { gte: date, lt: nextDate } }
                });

                chartData.push({
                    day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
                    amount: Number(daySum._sum.amount) || 0
                });
            }

            responseData.management = {
                revenueMonth: Number(revenueMonth._sum.amount) || 0,
                revenueTotal: Number(revenueTotal._sum.amount) || 0,
                recentPayments,
                chartData
            };
        }

        // 2. ADMINISTRATIVE ROLES (Secretary, Director, Censeur, Surveillant Général, Founder, Admin)
        if (['SECRETARY', 'DIRECTOR', 'CENSEUR', 'SURVEILLANT_GENERAL', 'FOUNDER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [newStudentsMonth, pendingEnrollments, latestStudents] = await Promise.all([
                prisma.student.count({
                    where: { establishmentId, createdAt: { gte: thirtyDaysAgo } }
                }),
                prisma.enrollment.count({
                    where: { student: { establishmentId }, status: 'PENDING' }
                }),
                prisma.student.findMany({
                    where: { establishmentId },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { enrollments: { include: { class: true }, take: 1 } }
                })
            ]);

            responseData.administrative = {
                newStudentsMonth,
                pendingEnrollments,
                latestStudents: latestStudents.map(s => ({
                    id: s.id,
                    name: `${s.firstName} ${s.lastName}`,
                    class: s.enrollments[0]?.class?.name || '---',
                    date: s.createdAt
                }))
            };
        }

        // 3. ACADEMIC ROLES (Teacher, Director, Censeur, Surveillant Général, Founder)
        if (['TEACHER', 'DIRECTOR', 'CENSEUR', 'SURVEILLANT_GENERAL', 'FOUNDER'].includes(role)) {
            const [subjectCount, recentGrades] = await Promise.all([
                prisma.subject.count({ where: { establishmentId } }),
                prisma.grade.findMany({
                    where: { student: { establishmentId } },
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { 
                        student: { select: { firstName: true, lastName: true } },
                        subject: { select: { name: true } }
                    }
                })
            ]);

            responseData.academic = {
                subjectCount,
                recentGrades: recentGrades.map(g => ({
                    id: g.id,
                    studentName: `${g.student.firstName} ${g.student.lastName}`,
                    subject: g.subject.name,
                    value: g.value,
                    date: g.createdAt
                }))
            };
        }

        res.json(responseData);
    } catch (error) {
        console.error('Dashboard Summary Error:', error);
        res.status(500).json({ message: 'Erreur lors du chargement du tableau de bord', error: error.message });
    }
});

module.exports = router;
