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
    const establishmentName = student.establishment?.name || 'INSTITUT DE TECHNOLOGIE APPLIQUÉE';
    doc.fontSize(9).fillColor('#ffffff').text(establishmentName.toUpperCase(), 5, 8, { align: 'center', width: width - 10 });
    
    const schoolYear = student.enrollments[0]?.schoolYear?.name || '2025-2026';
    doc.fontSize(7).text(`Année Scolaire: ${schoolYear}`, 5, 20, { align: 'center', width: width - 10 });

    // --- CONTENT AREA ---
    const topMargin = 38;
    const leftMargin = 8;

    // Student Photo
    const photoWidth = 55;
    const photoHeight = 65;
    
    doc.rect(leftMargin, topMargin, photoWidth, photoHeight).stroke('#1a237e');
    
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
                doc.fontSize(6).fillColor('#999').text('PHOTO', leftMargin + 15, topMargin + 30);
            }
        } else {
            doc.fontSize(6).fillColor('#999').text('PHOTO', leftMargin + 15, topMargin + 30);
        }
    }

    // Student Info
    const infoXLabel = leftMargin + photoWidth + 8;
    const infoXValue = infoXLabel + 82; // Increased from 60 to prevent overlap
    let currentY = topMargin;

    doc.fontSize(7).fillColor('#1a237e').text('CARTE D\'IDENTITÉ SCOLAIRE', infoXLabel, currentY - 5, { underline: true, characterSpacing: 0.5 });
    currentY += 12;

    const labels = [
        { label: 'N° D\'IMMATRICULATION:', value: student.regNumber, bold: true },
        { label: 'NOM:', value: student.lastName.toUpperCase(), bold: true },
        { label: 'PRÉNOM:', value: student.firstName },
        { label: 'DATE DE NAISSANCE:', value: new Date(student.dob).toLocaleDateString('fr-FR') },
        { label: 'LIEU DE NAISSANCE:', value: student.pob || '-' },
        { label: 'CLASSE:', value: student.enrollments[0]?.class?.name || '-', highlight: true }
    ];

    labels.forEach((item, idx) => {
        doc.fontSize(5.5).fillColor('#666').text(item.label, infoXLabel, currentY);
        
        if (item.highlight) {
            doc.fontSize(8).fillColor('#d32f2f').text(item.value, infoXValue, currentY - 1, { weight: 'bold' });
        } else {
            doc.fontSize(6.5).fillColor('#000').text(item.value, infoXValue, currentY);
        }
        currentY += 10.5;
    });

    // --- FOOTER / SIGNATURE ---
    const signatureY = height - 42;
    const director = student.establishment?.directorName ? `Le Directeur: ${student.establishment.directorName}` : 'Le Directeur';
    doc.fontSize(6).fillColor('#000').text(director, width - 85, signatureY, { align: 'center', width: 70 });
    doc.fontSize(5).fillColor('#999').text('(Signature & Cachet)', width - 85, signatureY + 18, { align: 'center', width: 70, italic: true });

    // Decorative bar at bottom
    doc.rect(2, height - 10, width - 4, 8).fill('#1a237e');
    doc.fontSize(5).fillColor('#ffffff').text('EDUSOFT - EXCELLENCE & DISCIPLINE', 2, height - 8, { align: 'center', width: width - 4, characterSpacing: 1 });

    doc.end();
};

module.exports = { generateStudentCardPDF };
