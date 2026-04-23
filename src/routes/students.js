const express = require('express');
const { prisma } = require('../context');
const { protect, authorize } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../lib/supabase');

const router = express.Router();

// Use Memory Storage for Vercel compatibility (Disk is read-only on Vercel)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadPhoto = multer({ 
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images are allowed (jpeg, jpg, png)'));
    }
});

// @desc    Register a new student
// @route   POST /api/students/register
// @access  Private (Admin, Secretary)
router.post('/register', protect, authorize('ADMIN', 'SECRETARY', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), auditLog('REGISTER_STUDENT'), async (req, res) => {
    const {
        studentData,
        student, // Alias for studentData
        parents,
        parentData,
        enrollmentData,
        enrollment, // Alias for enrollmentData
        historyData
    } = req.body;

    const finalStudentData = studentData || student;
    const finalEnrollmentData = enrollmentData || enrollment;

    console.log('--- REGISTER STUDENT ---', { hasStudentData: !!finalStudentData, hasEnrollmentData: !!finalEnrollmentData });

    if (!finalStudentData) {
        return res.status(400).json({ message: 'Missing student data' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Generate Matricule (Unique)
            const count = await tx.student.count({ where: { establishmentId: req.user.establishmentId } });
            const matricule = `STU${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`;

            // 2. Create Student
            const student = await tx.student.create({
                data: {
                    ...finalStudentData,
                    regNumber: matricule,
                    dob: new Date(finalStudentData.dob),
                    status: finalStudentData.status || 'ACTIF',
                    establishmentId: req.user.establishmentId
                }
            });

            // 3. Handle Parents
            const parentsToProcess = parents || (parentData ? [{ ...parentData, isPrimary: true }] : []);

            for (const p of parentsToProcess) {
                const { relation, isPrimary, isEmergency, ...cleanParentData } = p;

                let parentRecord = await tx.parent.findFirst({
                    where: { phonePrimary: cleanParentData.phonePrimary, establishmentId: req.user.establishmentId }
                });

                if (!parentRecord) {
                    parentRecord = await tx.parent.create({ data: { ...cleanParentData, establishmentId: req.user.establishmentId } });
                }

                await tx.parentStudent.create({
                    data: {
                        studentId: student.id,
                        parentId: parentRecord.id,
                        relation: relation || 'TUTEUR',
                        isPrimary: isPrimary ?? true,
                        isEmergency: isEmergency ?? false
                    }
                });
            }

            // 4. Create Enrollment
            let enrollment = null;
            if (finalEnrollmentData?.classId) {
                enrollment = await tx.enrollment.create({
                    data: {
                        studentId: student.id,
                        classId: finalEnrollmentData.classId,
                        schoolYearId: finalEnrollmentData.schoolYearId,
                        status: 'VALIDATED'
                    }
                });
            }

            // 5. Create History (Optional)
            if (historyData && Array.isArray(historyData)) {
                await tx.schoolHistory.createMany({
                    data: historyData.map(h => ({ ...h, studentId: student.id }))
                });
            }

            return { student, enrollment };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registering student', error: error.message });
    }
});

// @desc    Get all students (paginated)
// @route   GET /api/students
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const classId = req.query.classId || '';

        let where = { 
            establishmentId: req.user.establishmentId 
        };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { regNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (classId) {
            where.enrollments = {
                some: {
                    classId: classId,
                    schoolYear: { current: true }
                }
            };
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: {
                    enrollments: {
                        where: { schoolYear: { current: true } },
                        include: { class: true, schoolYear: true }
                    },
                    parents: {
                        include: { parent: true }
                    }
                },
                orderBy: { lastName: 'asc' },
                skip,
                take: limit
            }),
            prisma.student.count({ where })
        ]);

        res.json({
            students,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const XLSX = require('xlsx');

// @desc    Export students to Excel
// @route   GET /api/students/export
// @access  Private
router.get('/export', protect, async (req, res) => {
    try {
        const { classId, status, search } = req.query;
        
        let where = { establishmentId: req.user.establishmentId };
        
        if (classId) {
            where.enrollments = { 
                some: { 
                    classId: classId, 
                    schoolYear: { current: true } 
                } 
            };
        }
        
        if (status) {
            where.status = status;
        }
        
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { regNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                enrollments: {
                    where: { schoolYear: { current: true } },
                    include: { class: true }
                },
                parents: {
                    where: { isPrimary: true },
                    include: { parent: true }
                }
            },
            orderBy: [
                { enrollments: { _count: 'desc' } }, // Sort by those who have enrollments first
                { lastName: 'asc' }
            ]
        });

        // Format data for Excel
        const exportData = students.map(s => {
            const enrollment = s.enrollments[0];
            const primaryParent = s.parents.find(p => p.isPrimary)?.parent || s.parents[0]?.parent;

            return {
                'Matricule': s.regNumber,
                'Nom': s.lastName.toUpperCase(),
                'Prénoms': s.firstName,
                'Sexe': s.gender === 'M' ? 'Masculin' : 'Féminin',
                'Date de Naissance': new Date(s.dob).toLocaleDateString('fr-FR'),
                'Lieu de Naissance': s.pob || '---',
                'Classe': enrollment?.class?.name || '---',
                'Niveau': enrollment?.class?.level || '---',
                'Nationalité': s.nationality || '---',
                'Statut': s.status,
                'Parent': primaryParent ? `${primaryParent.lastName} ${primaryParent.firstName}` : '---',
                'Téléphone Parent': primaryParent?.phonePrimary || '---',
                'Adresse': s.address || '---'
            };
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Auto-size columns (basic helper)
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...exportData.map(row => String(row[key]).length)) + 2
        }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Liste des Elèves');
        
        // Generate Buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        const filename = `Liste_Eleves_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Export Excel Error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'exportation Excel', error: error.message });
    }
});

const { calculateStudentFinancials } = require('../utils/finance');

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const student = await prisma.student.findFirst({
            where: { 
                id: req.params.id,
                establishmentId: req.user.establishmentId
            },
            include: {
                enrollments: { include: { class: { include: { fees: true } }, schoolYear: true } },
                parents: { include: { parent: true } },
                payments: true,
                documents: true,
                schoolHistory: true
            }
        });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Calculate categorized financials using shared utility
        const fees = student.enrollments[0]?.class.fees || [];
        const payments = student.payments || [];

        const financials = calculateStudentFinancials(fees, payments);

        res.json({ ...student, financials });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @desc    Update student and parent info
// @route   PUT /api/students/:id
router.put('/:id', protect, authorize('ADMIN', 'SECRETARY', 'DIRECTOR', 'CENSEUR', 'SUPER_ADMIN'), auditLog('UPDATE_STUDENT'), async (req, res) => {
    const { studentData, parents } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Update Student
            const student = await tx.student.update({
                where: { 
                    id: req.params.id,
                    establishmentId: req.user.establishmentId
                },
                data: {
                    ...studentData,
                    dob: studentData.dob ? new Date(studentData.dob) : undefined
                }
            });

            // Update Parents if provided
            if (parents && Array.isArray(parents)) {
                for (const p of parents) {
                    const { parentId, relation, isPrimary, isEmergency, ...parentInfo } = p;

                    if (parentId) {
                        // Update existing parent record
                        await tx.parent.update({
                            where: { id: parentId },
                            data: parentInfo
                        });

                        // Update relationship
                        await tx.parentStudent.update({
                            where: {
                                studentId_parentId: {
                                    studentId: req.params.id,
                                    parentId: parentId
                                }
                            },
                            data: { relation, isPrimary, isEmergency }
                        });
                    } else {
                        // Create new parent and link
                        let newParent = await tx.parent.findFirst({
                            where: { phonePrimary: parentInfo.phonePrimary }
                        });

                        if (!newParent) {
                            newParent = await tx.parent.create({ data: parentInfo });
                        }

                        await tx.parentStudent.create({
                            data: {
                                studentId: req.params.id,
                                parentId: newParent.id,
                                relation: relation || 'TUTEUR',
                                isPrimary: isPrimary ?? false,
                                isEmergency: isEmergency ?? false
                            }
                        });
                    }
                }
            }

            return student;
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
});

// @desc    Upload student document
// @route   POST /api/students/:id/documents
router.post('/:id/documents', protect, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (!supabase) return res.status(500).json({ message: 'Supabase storage not configured' });

        const { name, type } = req.body;
        const fileExt = path.extname(req.file.originalname);
        const fileName = `doc-${Date.now()}${fileExt}`;
        const filePath = `${req.user.establishmentId}/${req.params.id}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('students')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('students')
            .getPublicUrl(filePath);

        const document = await prisma.document.create({
            data: {
                name: name || req.file.originalname,
                type: type || 'OTHER',
                url: publicUrl,
                studentId: req.params.id,
                establishmentId: req.user.establishmentId
            }
        });
        res.status(201).json(document);
    } catch (error) {
        console.error('Document Upload Error:', error);
        res.status(500).json({ message: 'Error uploading document', error: error.message });
    }
});

// @desc    Upload student profile photo
// @route   POST /api/students/:id/photo
router.post('/:id/photo', protect, uploadPhoto.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (!supabase) return res.status(500).json({ message: 'Supabase storage not configured' });

        const fileExt = path.extname(req.file.originalname);
        const fileName = `photo-${Date.now()}${fileExt}`;
        const filePath = `${req.user.establishmentId}/${req.params.id}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('students')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('students')
            .getPublicUrl(filePath);
        
        const student = await prisma.student.update({
            where: { 
                id: req.params.id,
                establishmentId: req.user.establishmentId
            },
            data: { photoUrl: publicUrl }
        });

        res.json({ message: 'Photo updated successfully', photoUrl: student.photoUrl });
    } catch (error) {
        console.error('Photo Upload Error:', error);
        res.status(500).json({ message: 'Error uploading photo', error: error.message });
    }
});

// @desc    Update document status/info
// @route   PUT /api/students/:id/documents/:docId
router.put('/:id/documents/:docId', protect, authorize('ADMIN', 'SECRETARY', 'SUPER_ADMIN'), async (req, res) => {
    try {
        const { status, expiryDate, name } = req.body;
        const document = await prisma.document.update({
            where: { 
                id: req.params.docId,
                student: { establishmentId: req.user.establishmentId }
            },
            data: {
                status,
                name,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined
            }
        });
        res.json(document);
    } catch (error) {
        res.status(500).json({ message: 'Error updating document', error: error.message });
    }
});

// @desc    Add school history
// @route   POST /api/students/:id/history
router.post('/:id/history', protect, authorize('ADMIN', 'SECRETARY', 'SUPER_ADMIN'), async (req, res) => {
    try {
        // Verify student belongs to establishment
        const student = await prisma.student.findUnique({
            where: { id: req.params.id, establishmentId: req.user.establishmentId }
        });
        if (!student) return res.status(404).json({ message: 'Student not found in this establishment.' });

        const history = await prisma.schoolHistory.create({
            data: {
                ...req.body,
                studentId: req.params.id,
                average: req.body.average ? parseFloat(req.body.average) : undefined
            }
        });
        res.status(201).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error adding history', error: error.message });
    }
});

const { generateStudentDossierPDF } = require('../utils/studentDossier');
const { generateStudentCardPDF } = require('../utils/studentCard');

// @desc    Download student dossier PDF
// @route   GET /api/students/:id/pdf
router.get('/:id/pdf', protect, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { 
                id: req.params.id,
                establishmentId: req.user.establishmentId
            },
            include: {
                enrollments: { include: { class: { include: { fees: true } }, schoolYear: true } },
                parents: { include: { parent: true } },
                payments: true,
                schoolHistory: true
            }
        });

        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Calculate basic checks for the PDF using shared utility
        const enrollment = student.enrollments[0];
        const fees = enrollment?.class?.fees || [];
        const payments = student.payments || [];

        student.financials = calculateStudentFinancials(fees, payments);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Dossier_${student.regNumber}.pdf`);

        generateStudentDossierPDF(student, res);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
});

// @desc    Download student ID Card PDF
// @route   GET /api/students/:id/card
router.get('/:id/card', protect, async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { 
                id: req.params.id,
                establishmentId: req.user.establishmentId
            },
            include: {
                enrollments: { include: { class: true, schoolYear: true } },
                establishment: true
            }
        });

        if (!student) return res.status(404).json({ message: 'Student not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Carte_${student.regNumber}.pdf`);

        generateStudentCardPDF(student, res);
    } catch (error) {
        res.status(500).json({ message: 'Error generating card', error: error.message });
    }
});

module.exports = router;
