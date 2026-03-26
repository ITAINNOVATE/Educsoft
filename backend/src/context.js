const { PrismaClient } = require('@prisma/client');

let prismaInstance;

function getPrisma() {
    if (prismaInstance) return prismaInstance;

    if (process.env.NODE_ENV === 'production') {
        prismaInstance = new PrismaClient({
            log: ['error', 'warn'],
        });
    } else {
        if (!global.prisma) {
            global.prisma = new PrismaClient({
                log: ['error', 'warn'],
            });
        }
        prismaInstance = global.prisma;
    }
    return prismaInstance;
}

if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not defined in environment variables.");
}

module.exports = {
    get prisma() {
        return getPrisma();
    }
};
