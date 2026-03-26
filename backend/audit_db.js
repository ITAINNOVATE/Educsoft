const { PrismaClient } = require('@prisma/client');

async function audit() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.jorecpcnhlstxzqdygda:EduSoft2026%21@aws-1-eu-west-3.pooler.supabase.com:5432/postgres?connect_timeout=30"
      }
    }
  });

  try {
    console.log("=== AUDIT USERS ===");
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, establishmentId: true }
    });
    console.log(JSON.stringify(users, null, 2));

    console.log("\n=== AUDIT ESTABLISHMENTS ===");
    const ests = await prisma.establishment.findMany();
    console.log(JSON.stringify(ests, null, 2));

  } catch (error) {
    console.error("AUDIT FAILURE:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
