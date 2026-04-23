const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
});

async function main() {
  try {
    const studentCount = await prisma.student.count();
    const userCount = await prisma.user.count();
    const estCount = await prisma.establishment.count();
    console.log(JSON.stringify({
      students: studentCount,
      users: userCount,
      establishments: estCount
    }));
  } catch (e) {
    console.error('Error reading dev.db:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
