const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateReceiptPDF = (payment, student, res) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });

    // Stream directly to response
    doc.pipe(res);

    // Business Header
    doc.fontSize(20).fillColor('#004d40').text('INSTITUT DE TECHNOLOGIE APPLIQUEE', { align: 'center', weight: 'bold' });
    doc.fontSize(16).text('(ITA)', { align: 'center', weight: 'bold' });
    doc.fontSize(10).fillColor('#444').text('Formation Professionnelle & Technique', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#004d40');
    doc.moveDown();

    // Receipt Info & Date
    doc.fontSize(10).fillColor('#000').text(`REÇU N°: ${payment.receiptNumber}`, { align: 'left' });
    doc.text(`DATE: ${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}`, { align: 'left' });
    doc.moveDown();

    // Student Information Block
    doc.rect(40, doc.y, doc.page.width - 80, 60).fill('#f9f9f9').stroke('#eee');
    const studentY = doc.y + 10;
    doc.fontSize(10).fillColor('#666').text('ÉLÈVE:', 50, studentY);
    doc.fontSize(12).fillColor('#000').text(`${student.firstName} ${student.lastName}`, 50, studentY + 15, { weight: 'bold' });
    doc.fontSize(10).text(`MATRICULE: ${student.regNumber}`, 50, studentY + 32);

    const enrollment = student.enrollments[0];
    if (enrollment) {
        doc.text(`CLASSE: ${enrollment.class.name}`, 200, studentY + 32);
    }
    doc.moveY(30);
    doc.moveDown(2);

    // Payment Details Table Header
    doc.fontSize(10).fillColor('#666').text('DÉSIGNATION', 50, doc.y);
    doc.text('MONTANT', 300, doc.y, { align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ddd');
    doc.moveDown(0.5);

    // Item row
    doc.fontSize(11).fillColor('#000').text(payment.feeName || 'Frais Scolaires', 50, doc.y);
    doc.text(`${payment.amount.toLocaleString()} FCFA`, 300, doc.y, { align: 'right', weight: 'bold' });
    doc.moveDown();

    // Total section
    doc.moveDown();
    doc.rect(200, doc.y, 200, 30).fill('#004d40').stroke('#004d40');
    doc.fontSize(12).fillColor('#fff').text('TOTAL RÉGLÉ:', 210, doc.y + 8);
    doc.text(`${payment.amount.toLocaleString()} FCFA`, 300, doc.y + 8, { align: 'right', weight: 'bold' });
    doc.fillColor('#000'); // Reset
    doc.moveDown(2.5);

    // REMAINING BALANCE SECTION
    if (student.financials) {
        // Calculate remaining for the specific category of the fee if possible, otherwise global
        // For simplicity on receipt, we usually show Global Remaining or Category Remaining
        // Let's show Global Remaining for now as it's the most important for the parent
        const remaining = student.financials.global.remaining;

        doc.fontSize(10).text(`Reste à payer (Total):`, 210, doc.y);
        doc.fontSize(11).fillColor(remaining > 0 ? '#c62828' : '#2e7d32')
            .text(`${remaining.toLocaleString()} FCFA`, 300, doc.y, { align: 'right', weight: 'bold' });
        doc.fillColor('#000');
        doc.moveDown(1);
    }

    // Payment Method & Notes
    doc.fontSize(10).text(`Mode de Règlement: ${payment.method}`, 40);
    if (payment.notes) {
        doc.fontSize(10).fillColor('#666').text(`Notes: ${payment.notes}`, { oblique: true });
    }
    doc.moveDown(3);

    // Signature Area
    const signatureY = doc.y;
    doc.fontSize(9).text('Signature Caissier', 50, signatureY);
    doc.text('Cachet de l\'Établissement', 250, signatureY);
    doc.moveDown();

    // Footer
    doc.fontSize(8).fillColor('#999').text('Ce reçu est généré électroniquement et ne nécessite pas de cachet physique pour être valide.', 40, doc.page.height - 40, { align: 'center' });

    // Handle stream errors and cleanup
    const cleanup = () => {
        doc.unpipe(res);
        if (!doc.closed) doc.end();
    };

    res.on('close', cleanup);
    res.on('finish', cleanup);

    doc.on('error', (err) => {
        console.error('PDF Generation Error:', err);
        cleanup();
        if (!res.headersSent) {
            res.status(500).send('Error generating PDF');
        }
    });

    doc.end();
};

module.exports = { generateReceiptPDF };
