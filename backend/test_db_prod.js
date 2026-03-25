const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.jorecpcnhlstxzqdygda:EduSoft2026%21@aws-1-eu-west-3.pooler.supabase.com:5432/postgres?connect_timeout=30"
      }
    }
  });

  try {
    console.log("Attempting to create establishment 'DIAGNOSTIC_TEST'...");
    const est = await prisma.establishment.create({
      data: {
        name: "DIAGNOSTIC_TEST",
        code: "DIAG" + Math.floor(Math.random() * 1000),
        address: "Diagnostic Address",
        email: "diag@test.com"
      }
    });
    console.log("SUCCESS! Establishment created:", est);
  } catch (error) {
    console.error("DIAGNOSTIC FAILURE:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    if (error.meta) console.error("Meta:", error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

test();
