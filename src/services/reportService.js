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

/**
 * Generate a Student Bulletin (Report Card) PDF
 * @param {Object} data - Student, Grades, Class, Ranking data
 * @param {Object} res - Express response stream
 */
const generateBulletinPDF = (data, res) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    const { student, classData, subjects, grades, rankings, term, establishment } = data;

    // --- 1. HEADER & BRANDING ---
    const primaryColor = '#1e3a8a';
    const secondaryColor = '#64748b';

    // Logo (Placeholder or Actual)
    if (establishment?.logoUrl) {
        // Logique pour image distante si nécessaire, ici on utilise du texte pour la résilience
    }

    doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text(establishment?.name || 'ÉTABLISSEMENT SCOLAIRE', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica').text(establishment?.address || 'Adresse de l\'école', { align: 'center' });
    doc.text(`Tél: ${establishment?.phone || ''} | Email: ${establishment?.email || ''}`, { align: 'center' });
    
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(primaryColor);
    doc.moveDown(1);

    // --- 2. BULLETIN INFO & STUDENT DETAILS ---
    const topY = doc.y;
    
    // Bulletin Title Box
    doc.rect(200, topY, 200, 30).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(`BULLETIN DE NOTES`, 200, topY + 8, { width: 200, align: 'center' });
    
    doc.moveDown(2);
    const midY = doc.y;

    // Student Info Left
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text(`ÉLÈVE :`, 40, midY);
    doc.font('Helvetica').text(`${student.firstName} ${student.lastName}`, 100, midY);
    doc.font('Helvetica-Bold').text(`MATRICULE :`, 40, midY + 15);
    doc.font('Helvetica').text(student.regNumber, 120, midY + 15);
    doc.font('Helvetica-Bold').text(`NÉ(E) LE :`, 40, midY + 30);
    doc.font('Helvetica').text(new Date(student.dob).toLocaleDateString('fr-FR'), 100, midY + 30);

    // Class/Term Info Right
    doc.font('Helvetica-Bold').text(`CLASSE :`, 350, midY);
    doc.font('Helvetica').text(classData.name, 410, midY);
    doc.font('Helvetica-Bold').text(`PÉRIODE :`, 350, midY + 15);
    doc.font('Helvetica').text(term.name, 415, midY + 15);
    doc.font('Helvetica-Bold').text(`ANNÉE :`, 350, midY + 30);
    doc.font('Helvetica').text(classData.schoolYear?.name || '', 410, midY + 30);

    doc.moveDown(3.5);

    // --- 3. GRADES TABLE ---
    const tableTop = doc.y;
    const cols = {
        subject: 40,
        coeff: 220,
        grade: 280,
        total: 340,
        rank: 400,
        apprec: 460
    };

    // Table Header
    doc.rect(40, tableTop, 515, 20).fill('#f1f5f9');
    doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
    doc.text('MATIÈRES', cols.subject + 5, tableTop + 6);
    doc.text('COEFF', cols.coeff, tableTop + 6);
    doc.text('NOTE/20', cols.grade, tableTop + 6);
    doc.text('TOTAL', cols.total, tableTop + 6);
    doc.text('RANG', cols.rank, tableTop + 6);
    doc.text('APPRÉCIATIONS', cols.apprec, tableTop + 6);

    let currentY = tableTop + 20;

    subjects.forEach((subj, index) => {
        const gradeObj = grades.find(g => g.subjectId === subj.id);
        const val = gradeObj?.value ?? null;
        const total = val !== null ? (val * subj.coefficient).toFixed(2) : '--';
        
        // Subject Rank Calculation (Local to this list)
        const subRank = rankings.subjectRanks?.[subj.id] || '--';

        // Row Stripe
        if (index % 2 !== 0) doc.rect(40, currentY, 515, 20).fill('#f8fafc');

        doc.fillColor('#000000').fontSize(9).font('Helvetica');
        doc.text(subj.name, cols.subject + 5, currentY + 6);
        doc.text(subj.coefficient.toString(), cols.coeff, currentY + 6);
        doc.font(val !== null && val < 10 ? 'Helvetica-Bold' : 'Helvetica');
        doc.fillColor(val !== null && val < 10 ? '#b91c1c' : '#000000');
        doc.text(val !== null ? val.toFixed(2) : '--', cols.grade, currentY + 6);
        doc.fillColor('#000000').font('Helvetica');
        doc.text(total, cols.total, currentY + 6);
        doc.text(subRank.toString(), cols.rank, currentY + 6);
        
        // Appreciation logic
        let apprec = '--';
        if (val !== null) {
            if (val >= 16) apprec = 'Très Bien';
            else if (val >= 14) apprec = 'Bien';
            else if (val >= 12) apprec = 'Assez Bien';
            else if (val >= 10) apprec = 'Passable';
            else apprec = 'Insuffisant';
        }
        doc.fontSize(8).text(apprec, cols.apprec, currentY + 6);

        currentY += 20;
    });

    // --- 4. SUMMARY & OVERALL RESULTS ---
    doc.moveDown(1);
    const summaryY = doc.y;

    doc.rect(40, summaryY, 250, 80).stroke('#e2e8f0');
    doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica-Bold').text('RÉSULTATS DE LA PÉRIODE', 50, summaryY + 10);
    
    const statsX = 50;
    const statsValX = 180;
    
    doc.fillColor('#000000').fontSize(9).font('Helvetica');
    doc.text('Total Coeffs :', statsX, summaryY + 30);
    doc.text(rankings.totalCoeffs.toString(), statsValX, summaryY + 30);
    
    doc.text('Total Points :', statsX, summaryY + 45);
    doc.text(rankings.totalPoints.toFixed(2), statsValX, summaryY + 45);
    
    doc.font('Helvetica-Bold').fontSize(11).text('MOYENNE GÉNÉRALE :', statsX, summaryY + 62);
    doc.fillColor(rankings.average < 10 ? '#b91c1c' : '#166534').text(`${rankings.average.toFixed(2)} / 20`, statsValX, summaryY + 62);

    // Class Stats (Right Side)
    doc.rect(305, summaryY, 250, 80).stroke('#e2e8f0');
    doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('STATISTIQUES CLASSE', 315, summaryY + 10);
    
    doc.fillColor('#000000').fontSize(9).font('Helvetica');
    doc.text('Moyenne de la classe :', 315, summaryY + 30);
    doc.text(rankings.classAverage.toFixed(2), 480, summaryY + 30);
    
    doc.text('Moy. Max / Min :', 315, summaryY + 45);
    doc.text(`${rankings.maxAverage.toFixed(2)} / ${rankings.minAverage.toFixed(2)}`, 480, summaryY + 45);
    
    doc.font('Helvetica-Bold').fontSize(12).text('RANG :', 315, summaryY + 62);
    doc.fillColor('#1e3a8a').text(`${rankings.rank} ème sur ${rankings.totalStudents}`, 480, summaryY + 62);

    // --- 5. OBSERVATIONS & SIGNATURES ---
    doc.moveDown(6);
    const footerY = doc.y;

    doc.rect(40, footerY, 515, 60).stroke('#e2e8f0');
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('APPRÉCIATION DU CONSEIL DE CLASSE / OBSERVATIONS :', 50, footerY + 10);
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique').text('(Espace réservé à l\'administration pour les commentaires pédagogiques)', 50, footerY + 25);

    doc.moveDown(5);
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text('LE DIRECTEUR / LE CHEF D\'ÉTABLISSEMENT', 40, doc.y, { align: 'right', width: 515 });
    doc.fontSize(8).font('Helvetica').text('(Signature et Cachet)', 40, doc.y + 12, { align: 'right', width: 515 });

    doc.end();
};

module.exports = {
    generateAccountingReport,
    generateBulletinPDF
};
