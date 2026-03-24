/**
 * Calculate financial status for a student based on their fees and payments.
 * 
 * @param {Object} student - The student object (optional, for context)
 * @param {Array} fees - List of fee objects from the student's class
 * @param {Array} payments - List of payment objects for the student
 * @returns {Object} detailed financial breakdown
 */
const calculateStudentFinancials = (fees = [], payments = []) => {

    const getCategoryStats = (category) => {
        const catFees = fees.filter(f => f.category === category);

        const detailedFees = catFees.map(f => {
            const paid = payments
                .filter(p => p.feeId === f.id)
                .reduce((acc, p) => acc + p.amount, 0);

            return {
                id: f.id,
                name: f.name,
                category: f.category,
                amount: f.amount,
                paid: paid,
                remaining: Math.max(0, f.amount - paid)
            };
        });

        // Fallback for payments without feeId (Legacy/General payments)
        // We attribute them to the first fee in the category, or just track them if needed.
        // The original logic in students.js attributed them to the first fee of ANNUAL_OBLIGATORY.
        // Here we try to be a bit more robust but stick to the precedent for now to avoid breaking changes.

        if (category === 'ANNUAL_OBLIGATORY') {
            const extraPayments = payments.filter(p => !p.feeId).reduce((acc, p) => acc + p.amount, 0);
            if (extraPayments > 0) {
                if (detailedFees.length > 0) {
                    detailedFees[0].paid += extraPayments;
                    // Re-calculate remaining for this specific fee
                    detailedFees[0].remaining = Math.max(0, detailedFees[0].amount - detailedFees[0].paid);
                    // If there is still "overpayment" (paid > amount), it naturally flows into "totalPaid" but 
                    // detailedFees[0].remaining is capped at 0. 
                    // Ideally, overpayments should cascade, but for now we keep it simple as per original logic.
                } else {
                    // No obligatory fees defined but we have payments? 
                    // This is an edge case. We might want to return a "General" credit.
                }
            }
        }

        const totalDue = detailedFees.reduce((acc, f) => acc + f.amount, 0);

        // precise total paid for this category
        // We need to be careful not to double count the extraPayments if we added them to detailedFees[0].paid using the logic above.
        // Since we modified detailedFees[0].paid, the reduce below INCLUDES extraPayments.
        const totalPaid = detailedFees.reduce((acc, f) => acc + f.paid, 0);

        return {
            totalDue,
            totalPaid,
            remaining: Math.max(0, totalDue - totalPaid),
            details: detailedFees
        };
    };

    const obligatory = getCategoryStats('ANNUAL_OBLIGATORY');
    const optional = getCategoryStats('OPTIONAL');
    const occasional = getCategoryStats('OCCASIONAL');

    const globalTotalDue = fees.reduce((acc, f) => acc + f.amount, 0);
    const globalTotalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    return {
        OBLIGATORY: obligatory,
        OPTIONAL: optional,
        OCCASIONAL: occasional,
        global: {
            totalDue: globalTotalDue,
            totalPaid: globalTotalPaid,
            remaining: Math.max(0, globalTotalDue - globalTotalPaid)
        }
    };
};

module.exports = { calculateStudentFinancials };
