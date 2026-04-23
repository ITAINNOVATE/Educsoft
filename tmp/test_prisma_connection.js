const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("SUCCESS: Prisma connected successfully!");
    const users = await prisma.user.count();
    console.log("User count:", users);
  } catch (err) {
    console.error("FAILURE: Connection failed.");
    console.error("Error Detail:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
