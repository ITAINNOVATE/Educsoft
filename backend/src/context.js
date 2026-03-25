const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
        log: ['error', 'warn'],
    });
} else {
    // In development, use a global variable so that the value
    // is preserved across module reloads caused by HMR.
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            log: ['error', 'warn'],
        });
    }
    prisma = global.prisma;
}

if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not defined in environment variables.");
}

module.exports = {
    prisma,
};
