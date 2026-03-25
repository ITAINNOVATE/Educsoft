const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not defined in environment variables.");
}

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

module.exports = {
    prisma,
};
