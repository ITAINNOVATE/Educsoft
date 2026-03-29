const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const ests = await prisma.establishment.findMany({
            include: {
                _count: {
                    select: { students: true, users: true }
                }
            }
        });
        console.log(JSON.stringify(ests, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
