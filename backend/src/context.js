const { PrismaClient } = require('@prisma/client');

let prismaInstance = null;

function getPrisma() {
    if (prismaInstance) return prismaInstance;
    
    try {
        prismaInstance = new PrismaClient({
            log: ['error', 'warn'],
        });
        return prismaInstance;
    } catch (error) {
        console.error("PRISMA_INIT_CRASH:", error);
        return {
            $queryRaw: () => { throw new Error("Prisma failed to initialize: " + error.message); },
            user: { findUnique: () => { throw new Error("Prisma failed to initialize"); } },
            establishment: { findUnique: () => { throw new Error("Prisma failed to initialize"); } }
        };
    }
}

module.exports = {
    get prisma() {
        return getPrisma();
    }
};
