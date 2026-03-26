const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testLoginSim() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.jorecpcnhlstxzqdygda:EduSoft2026%21@aws-1-eu-west-3.pooler.supabase.com:5432/postgres?connect_timeout=30"
      }
    }
  });

  const email = 'superadmin@edusoft.bj';
  const password = 'Admin@2026';
  const establishmentCode = 'ITA2026';

  try {
    console.log(`Step 1: Finding establishment ${establishmentCode}...`);
    const establishment = await prisma.establishment.findUnique({
        where: { code: establishmentCode }
    });
    console.log("Found:", establishment.name);

    console.log(`Step 2: Finding user ${email}...`);
    let user = await prisma.user.findFirst({ 
        where: { 
            email: { equals: email, mode: 'insensitive' },
            OR: [
                { establishmentId: establishment.id },
                { role: 'SUPER_ADMIN' }
            ]
        } 
    });
    console.log("Found User ID:", user.id, "Role:", user.role);

    console.log("Step 3: Comparing password...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password Match:", isMatch);

    if (isMatch) {
        console.log("Step 4: Updating lastLogin...");
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        console.log("lastLogin updated.");
    }

    console.log("SUCCESS: Simulation complete.");

  } catch (error) {
    console.error("SIMULATION FAILURE:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginSim();
