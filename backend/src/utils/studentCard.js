const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const generateStudentCardPDF = (student, res) => {
    // 1cm = 28.35 points
    // 8.5cm = 241pt, 5.5cm = 156pt
    const width = 241;
    const height = 156;

    const doc = new PDFDocument({
        size: [width, height],
        margin: 5
    });

    doc.pipe(res);

    // --- BACKGROUND & BORDER ---
    doc.rect(0, 0, width, height).fill('#ffffff');
    doc.rect(2, 2, width - 4, height - 4).lineWidth(1).stroke('#1a237e');

    // --- HEADER ---
    doc.rect(2, 2, width - 4, 30).fill('#1a237e');
    doc.fontSize(9).fillColor('#ffffff').text('INSTITUT DE TECHNOLOGIE APPLIQUÉE', 5, 8, { align: 'center', width: width - 10 });
    
    const schoolYear = student.enrollments[0]?.schoolYear?.name || '2025-2026';
    doc.fontSize(7).text(`Année Scolaire: ${schoolYear}`, 5, 20, { align: 'center', width: width - 10 });

    // --- CONTENT AREA ---
    const topMargin = 38;
    const leftMargin = 8;

    // Student Photo
    const photoWidth = 55;
    const photoHeight = 65;
    
    doc.rect(leftMargin, topMargin, photoWidth, photoHeight).stroke('#ddd');
    
    if (student.photoUrl) {
        const absolutePath = path.join(process.cwd(), student.photoUrl);
        if (fs.existsSync(absolutePath)) {
            try {
                doc.image(absolutePath, leftMargin + 1, topMargin + 1, {
                    fit: [photoWidth - 2, photoHeight - 2],
                    align: 'center',
                    valign: 'center'
                });
            } catch (err) {
                console.error('Error embedding image:', err);
                doc.fontSize(6).fillColor('#999').text('PHOTO', leftMargin + 15, topMargin + 30);
            }
        } else {
            doc.fontSize(6).fillColor('#999').text('PHOTO', leftMargin + 15, topMargin + 30);
        }
    } else {
        doc.fontSize(6).fillColor('#999').text('PHOTO', leftMargin + 15, topMargin + 30);
    }

    // Student Info
    const infoX = leftMargin + photoWidth + 10;
    let currentY = topMargin;

    doc.fontSize(7).fillColor('#1a237e').text('CARTE D\'IDENTITÉ SCOLAIRE', infoX, currentY - 5, { underline: true });
    currentY += 10;

    doc.fontSize(6).fillColor('#666').text('N° D\'IMMATRICULATION:', infoX, currentY);
    doc.fontSize(7).fillColor('#000').text(student.regNumber, infoX + 60, currentY, { weight: 'bold' });
    currentY += 10;

    doc.fontSize(6).fillColor('#666').text('NOM:', infoX, currentY);
    doc.fontSize(7).fillColor('#000').text(student.lastName, infoX + 60, currentY, { weight: 'bold' });
    currentY += 10;

    doc.fontSize(6).fillColor('#666').text('PRÉNOM:', infoX, currentY);
    doc.fontSize(7).fillColor('#000').text(student.firstName, infoX + 60, currentY);
    currentY += 10;

    const dobStr = new Date(student.dob).toLocaleDateString('fr-FR');
    doc.fontSize(6).fillColor('#666').text('DATE DE NAISSANCE:', infoX, currentY);
    doc.fontSize(7).fillColor('#000').text(dobStr, infoX + 60, currentY);
    currentY += 10;

    doc.fontSize(6).fillColor('#666').text('LIEU DE NAISSANCE:', infoX, currentY);
    doc.fontSize(7).fillColor('#000').text(student.pob || '-', infoX + 60, currentY);
    currentY += 10;

    const className = student.enrollments[0]?.class?.name || '-';
    doc.fontSize(6).fillColor('#666').text('CLASSE:', infoX, currentY);
    doc.fontSize(8).fillColor('#d32f2f').text(className, infoX + 60, currentY, { weight: 'bold' });

    // --- FOOTER / SIGNATURE ---
    doc.fontSize(6).fillColor('#000').text('Le Directeur', width - 80, height - 35, { align: 'center' });
    doc.fontSize(5).fillColor('#888').text('(Signature & Cachet)', width - 80, height - 15, { align: 'center', italic: true });

    // Decorative bar at bottom
    doc.rect(2, height - 8, width - 4, 6).fill('#1a237e');
    doc.fontSize(4).fillColor('#ffffff').text('EDUSOFT - EXCELLENCE & DISCIPLINE', 0, height - 6, { align: 'center', width: width });

    doc.end();
};

module.exports = { generateStudentCardPDF };
