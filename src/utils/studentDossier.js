const PDFDocument = require('pdfkit');

const generateStudentDossierPDF = async (student, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Stream directly to response
    doc.pipe(res);

    // --- HEADER ---
    doc.fontSize(24).fillColor('#004d40').text('DOSSIER ÉLÈVE', { align: 'center', weight: 'bold' });
    doc.fontSize(10).fillColor('#666').text('INSTITUT DE TECHNOLOGIE APPLIQUEE (ITA) - Année Scolaire 2023-2024', { align: 'center' }); // Dynamic year would be better
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#004d40');
    doc.moveDown();

    // --- STUDENT IDENTITY ---
    const startY = doc.y;

    // Photo (Left)
    doc.rect(50, startY, 100, 120).stroke('#ddd');
    
    if (student.photoUrl) {
        try {
            let imageSource;
            if (student.photoUrl.startsWith('http')) {
                const response = await fetch(student.photoUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    imageSource = Buffer.from(arrayBuffer);
                }
            } else {
                const absolutePath = require('path').join(process.cwd(), student.photoUrl);
                if (require('fs').existsSync(absolutePath)) {
                    imageSource = absolutePath;
                }
            }

            if (imageSource) {
                doc.image(imageSource, 55, startY + 5, {
                    fit: [90, 110],
                    align: 'center',
                    valign: 'center'
                });
            } else {
                doc.fontSize(8).fillColor('#999').text('PHOTO', 85, startY + 55);
            }
        } catch (err) {
            console.error('Error loading image for Dossier:', err);
            doc.fontSize(8).fillColor('#999').text('PHOTO', 85, startY + 55);
        }
    } else {
        doc.fontSize(8).fillColor('#999').text('PHOTO', 85, startY + 55);
    }

    // Info (Right)
    const infoX = 170;
    doc.fontSize(14).fillColor('#000').text(`${student.firstName} ${student.lastName}`, infoX, startY).moveDown(0.5);

    doc.fontSize(10).fillColor('#444');
    doc.text(`Matricule: ${student.regNumber}`, infoX, doc.y);
    doc.text(`Classe Actuelle: ${student.enrollments[0]?.class?.name || 'Non inscrit'}`, infoX, doc.y + 15);
    doc.text(`Date de Naissance: ${new Date(student.dob).toLocaleDateString('fr-FR')}`, infoX, doc.y + 15);
    doc.text(`Lieu: ${student.pob}`, infoX, doc.y + 15);
    doc.text(`Sexe: ${student.gender === 'M' ? 'Masculin' : 'Féminin'}`, infoX, doc.y + 15);
    doc.text(`Nationalité: ${student.nationality}`, infoX, doc.y + 15);
    doc.text(`Adresse: ${student.address || 'Non renseignée'}`, infoX, doc.y + 15);

    doc.moveDown(4);

    // --- PARENTS / TUTEURS ---
    doc.fontSize(14).fillColor('#004d40').text('RESPONSABLES & CONTACTS');
    doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#004d40');
    doc.moveDown();

    if (student.parents && student.parents.length > 0) {
        student.parents.forEach((p, index) => {
            const parent = p.parent;
            doc.fontSize(11).fillColor('#000').text(`${parent.firstName} ${parent.lastName} (${p.relation})`, { weight: 'bold' });
            doc.fontSize(10).fillColor('#555');
            doc.text(`Tel: ${parent.phonePrimary} ${parent.phoneSecondary ? '/ ' + parent.phoneSecondary : ''}`);
            doc.text(`Email: ${parent.email || '-'}`);
            doc.text(`Profession: ${parent.occupation || '-'}`);
            doc.moveDown(0.5);
        });
    } else {
        doc.text('Aucun parent enregistré.', { oblique: true });
    }
    doc.moveDown();

    // --- HISTORIQUE SCOLAIRE ---
    doc.addPage();
    doc.fontSize(14).fillColor('#004d40').text('HISTORIQUE SCOLAIRE');
    doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#004d40');
    doc.moveDown();

    if (student.schoolHistory && student.schoolHistory.length > 0) {
        // Table Header
        const tableTop = doc.y;
        doc.fontSize(10).fillColor('#000');
        doc.text('Année', 50, tableTop);
        doc.text('Classe', 150, tableTop);
        doc.text('École', 300, tableTop);
        doc.text('Moyenne', 450, tableTop);
        doc.text('Résultat', 500, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#ccc');

        let y = tableTop + 25;
        student.schoolHistory.forEach(h => {
            doc.text(h.schoolYear, 50, y);
            doc.text(h.className, 150, y);
            doc.text(h.schoolName, 300, y);
            doc.text(h.average?.toString() || '-', 450, y);
            doc.text(h.result, 500, y);
            y += 20;
        });
    } else {
        doc.text('Aucun historique disponible.', { oblique: true });
    }
    doc.moveDown(3);

    // --- SITUATION FINANCIÈRE (Simplifiée) ---
    doc.fontSize(14).fillColor('#004d40').text('SITUATION FINANCIÈRE ACTUELLE');
    doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke('#004d40');
    doc.moveDown();

    if (student.financials) {
        const { global, OBLIGATORY, OPTIONAL } = student.financials;
        doc.fontSize(11).fillColor('#000');
        doc.text(`Total Frais Scolaires: ${global.totalDue.toLocaleString()} FCFA`);
        doc.text(`Total Payé: ${global.totalPaid.toLocaleString()} FCFA`);

        const balanceColor = global.remaining > 0 ? '#c62828' : '#2e7d32';
        doc.fillColor(balanceColor).text(`Reste à Payer Total: ${global.remaining.toLocaleString()} FCFA`, { weight: 'bold' });

        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#555');
        if (OBLIGATORY.remaining > 0) doc.text(`- Obligatoire: ${OBLIGATORY.remaining.toLocaleString()} FCFA`);
        if (OPTIONAL.remaining > 0) doc.text(`- Optionnel: ${OPTIONAL.remaining.toLocaleString()} FCFA`);

    } else {
        doc.text('Données financières non disponibles.');
    }

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#aaa').text(
            `Généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i + 1} / ${range.count}`,
            50,
            doc.page.height - 30,
            { align: 'center', width: doc.page.width - 100 }
        );
    }

    doc.end();
};

module.exports = { generateStudentDossierPDF };
