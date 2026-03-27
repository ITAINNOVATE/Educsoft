let prismaInstance = null;

function getPrisma() {
    if (prismaInstance) return prismaInstance;
    
    try {
        // RADICAL ISOLATION: Require only when needed
        const { PrismaClient } = require('@prisma/client');
        prismaInstance = new PrismaClient({
            log: ['error', 'warn'],
        });
        return prismaInstance;
    } catch (error) {
        console.error("PRISMA_DYNAMIC_IMPORT_CRASH:", error);
        // Fallback mock to prevent total crash
        return {
            $queryRaw: () => { throw new Error("Prisma dynamic import failed: " + error.message); },
            user: { findFirst: () => null, findUnique: () => null },
            establishment: { findUnique: () => null }
        };
    }
}

module.exports = {
    get prisma() {
        return getPrisma();
    }
};
