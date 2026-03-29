const PDFDocument = require('pdfkit');

/**
 * Generate a PDF accounting report
 * @param {Object} data - The report data (stats, debts, establishment info)
 * @param {Object} res - Express response stream
 */
const generateAccountingReport = (data, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Stream the PDF to the response
    doc.pipe(res);

    // --- Header Section ---
    doc.fillColor('#1a237e')
       .fontSize(24)
       .text(data.establishmentName || 'EDUSOFT - RAPPORT FINANCIER', { align: 'center' });
    
    doc.moveDown(0.5)
       .fontSize(10)
       .fillColor('#666666')
       .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });
    
    doc.moveDown(0.2)
       .text(`Période: ${data.dateRange?.start || 'Début'} au ${data.dateRange?.end || 'Aujourd\'hui'}`, { align: 'center' });

    doc.moveDown(2);

    // --- stats Summary Grid ---
    const startX = 50;
    const boxWidth = 150;
    const boxHeight = 60;
    const spacing = 20;

    const stats = [
        { label: 'Recettes Totales', value: `${(data.stats?.revenueTotal || 0).toLocaleString()} FCFA`, color: '#e8f5e9', textColor: '#2e7d32' },
        { label: 'Arriérés Totaux', value: `${(data.totalDebt || 0).toLocaleString()} FCFA`, color: '#ffebee', textColor: '#c62828' },
        { label: 'Recettes du Mois', value: `${(data.stats?.revenueMonth || 0).toLocaleString()} FCFA`, color: '#e3f2fd', textColor: '#1565c0' }
    ];

    stats.forEach((stat, i) => {
        const x = startX + i * (boxWidth + spacing);
        const y = doc.y;

        // Draw background box
        doc.rect(x, y, boxWidth, boxHeight)
           .fillAndStroke(stat.color, '#eeeeee');

        // Text
        doc.fillColor('#666666').fontSize(8).text(stat.label, x + 10, y + 15);
        doc.fillColor(stat.textColor).fontSize(14).text(stat.value, x + 10, y + 30, { width: boxWidth - 20, bold: true });
    });

    doc.moveDown(5);

    // --- Debts Table ---
    doc.fillColor('#1a237e').fontSize(14).text('Liste des Arriérés de Paiement', { underline: true });
    doc.moveDown(1);

    const tableTop = doc.y;
    const col1 = 50; // Nom
    const col2 = 250; // Classe
    const col3 = 350; // Payé
    const col4 = 450; // Reste

    // Header row
    doc.fontSize(10).fillColor('#333333');
    doc.text('ÉLÈVE', col1, tableTop, { bold: true });
    doc.text('CLASSE', col2, tableTop, { bold: true });
    doc.text('PAYÉ', col3, tableTop, { bold: true });
    doc.text('RESTE', col4, tableTop, { bold: true });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#cccccc');

    let currentY = tableTop + 25;

    data.debts.forEach((debt, index) => {
        // Stripe background for even rows
        if (index % 2 === 0) {
            doc.rect(50, currentY - 5, 500, 20).fill('#f9f9f9');
        }

        doc.fillColor('#000000').fontSize(9);
        doc.text(debt.name, col1, currentY);
        doc.text(debt.className, col2, currentY);
        doc.text(debt.paid.toLocaleString(), col3, currentY);
        doc.fillColor('#c62828').text(debt.balance.toLocaleString(), col4, currentY, { bold: true });

        currentY += 20;

        // Page break if near bottom
        if (currentY > 750) {
            doc.addPage();
            currentY = 50;
        }
    });

    // Final Footer
    const pageCount = doc.bufferedPageRange().count;
    doc.fontSize(8).fillColor('#999999').text(`Page 1 sur ${pageCount}`, 50, 780, { align: 'center' });

    doc.end();
};

module.exports = {
    generateAccountingReport
};
