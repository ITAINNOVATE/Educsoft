const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const establishments = await prisma.establishment.findMany();
    console.log('Establishments found:', JSON.stringify(establishments, null, 2));
  } catch (error) {
    console.error('Error fetching establishments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
