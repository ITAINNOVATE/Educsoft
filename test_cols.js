const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const e = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='expenses'`;
        console.log(e);
    } catch(e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}
run()
