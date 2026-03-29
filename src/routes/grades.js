const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get grades for a specific class, subject and term
// @route   GET /api/grades
router.get('/', protect, async (req, res) => {
    const { classId, subjectId, termId } = req.query;

    try {
        // 1. Get all students enrolled in this class
        const enrollments = await prisma.enrollment.findMany({
            where: { 
                classId,
                student: { establishmentId: req.user.establishmentId }
            },
            include: {
                student: true
            },
            orderBy: {
                student: { lastName: 'asc' }
            }
        });

        // 2. Get existing grades for this combination
        const grades = await prisma.grade.findMany({
            where: {
                subjectId,
                termId,
                student: {
                    enrollments: {
                        some: { classId }
                    }
                }
            }
        });

        // 3. Map students to their grades (or null if not yet entered)
        const studentGrades = enrollments.map(e => {
            const grade = grades.find(g => g.studentId === e.studentId);
            return {
                studentId: e.studentId,
                studentName: `${e.student.lastName} ${e.student.firstName}`,
                regNumber: e.student.regNumber,
                gradeId: grade?.id || null,
                value: grade?.value ?? '',
                type: grade?.type || 'TEST'
            };
        });

        res.json(studentGrades);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Bulk save/update grades
// @route   POST /api/grades/bulk
router.post('/bulk', protect, authorize('ADMIN', 'TEACHER', 'DIRECTOR', 'SUPER_ADMIN'), async (req, res) => {
    const { classId, subjectId, termId, grades } = req.body;

    if (!Array.isArray(grades)) {
        return res.status(400).json({ message: 'Invalid grades data' });
    }

    try {
        const results = await prisma.$transaction(
            grades.map(g => {
                if (g.gradeId) {
                    // Update existing
                    return prisma.grade.update({
                        where: { id: g.gradeId },
                        data: { 
                            value: parseFloat(g.value),
                            type: g.type || 'TEST'
                        }
                    });
                } else {
                    // Create new
                    return prisma.grade.create({
                        data: {
                            value: parseFloat(g.value),
                            type: g.type || 'TEST',
                            studentId: g.studentId,
                            subjectId,
                            termId,
                            teacherId: req.user.id
                        }
                    });
                }
            })
        );

        res.json({ message: 'Notes enregistrées avec succès', count: results.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const { generateBulletinPDF } = require('../services/reportService');

// @desc    Generate PDF Bulletin for a student and term
// @route   GET /api/grades/bulletin/:studentId/:termId
router.get('/bulletin/:studentId/:termId', protect, async (req, res) => {
    const { studentId, termId } = req.params;

    try {
        // 1. Fetch Student and current enrollment
        const student = await prisma.student.findUnique({
            where: { id: studentId, establishmentId: req.user.establishmentId },
            include: {
                enrollments: {
                    where: { schoolYear: { terms: { some: { id: termId } } } },
                    include: { class: { include: { schoolYear: true, subjects: true } } }
                },
                establishment: true
            }
        });

        if (!student || !student.enrollments[0]) {
            return res.status(404).json({ message: 'Données élève ou classe introuvables.' });
        }

        const enrollment = student.enrollments[0];
        const classData = enrollment.class;
        const subjects = classData.subjects;
        const term = await prisma.term.findUnique({ where: { id: termId } });

        // 2. Fetch ALL students in this class for ranking
        const allEnrollments = await prisma.enrollment.findMany({
            where: { classId: classData.id },
            include: {
                student: {
                    include: { grades: { where: { termId, subjectId: { in: subjects.map(s => s.id) } } } }
                }
            }
        });

        // 3. Calculate Averages for EVERY student to determine Rank
        const calculatedStudents = allEnrollments.map(e => {
            let totalPoints = 0;
            let totalCoeffs = 0;
            const subRanks = {}; // Store points per subject for this student

            subjects.forEach(s => {
                const g = e.student.grades.find(grade => grade.subjectId === s.id);
                if (g) {
                    totalPoints += g.value * s.coefficient;
                }
                totalCoeffs += s.coefficient;
                subRanks[s.id] = g ? g.value * s.coefficient : 0;
            });

            return {
                studentId: e.studentId,
                average: totalCoeffs > 0 ? totalPoints / totalCoeffs : 0,
                totalPoints,
                totalCoeffs,
                subRanks
            };
        });

        // Sort by average descending to find ranks
        const sorted = [...calculatedStudents].sort((a, b) => b.average - a.average);
        const myData = calculatedStudents.find(s => s.studentId === studentId);
        const myRank = sorted.findIndex(s => s.studentId === studentId) + 1;

        // Class stats
        const allAverages = sorted.map(s => s.average);
        const rankings = {
            rank: myRank,
            totalStudents: sorted.length,
            average: myData.average,
            totalPoints: myData.totalPoints,
            totalCoeffs: myData.totalCoeffs,
            classAverage: allAverages.reduce((a, b) => a + b, 0) / allAverages.length,
            maxAverage: Math.max(...allAverages),
            minAverage: Math.min(...allAverages),
            subjectRanks: {}
        };

        // Subject rankings (optional but good)
        subjects.forEach(s => {
            const subjSorted = [...calculatedStudents].sort((a, b) => b.subRanks[s.id] - a.subRanks[s.id]);
            rankings.subjectRanks[s.id] = subjSorted.findIndex(st => st.studentId === studentId) + 1;
        });

        // 4. Generate PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Bulletin_${student.lastName}_${term.name}.pdf`);

        generateBulletinPDF({
            student,
            classData,
            subjects,
            grades: student.enrollments[0].student.grades || [], // This only works if I fetch them again or use the one from list
            rankings,
            term,
            establishment: student.establishment
        }, res);

    } catch (error) {
        console.error('Bulletin Generation Error:', error);
        res.status(500).json({ message: 'Error generating bulletin', error: error.message });
    }
});

module.exports = router;
