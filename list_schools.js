const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const establishments = await prisma.establishment.findMany({
    select: {
      id: true,
      name: true,
      code: true
    }
  });
  console.log(JSON.stringify(establishments, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
