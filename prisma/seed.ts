import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables from .env.local
config({ path: ".env.local" });

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: "sarah.chen@test.founderfinder.com",
    name: "Sarah Chen",
    role: "CEO" as const,
  },
  {
    email: "alex.kumar@test.founderfinder.com",
    name: "Alex Kumar",
    role: "CTO" as const,
  },
  {
    email: "maria.garcia@test.founderfinder.com",
    name: "Maria Garcia",
    role: "CEO" as const,
  },
  {
    email: "james.wilson@test.founderfinder.com",
    name: "James Wilson",
    role: "CTO" as const,
  },
];

async function main() {
  console.log("Seeding test users...");

  for (const user of TEST_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`  User ${user.email} already exists, skipping.`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        onboarded: false,
      },
    });
    console.log(`  Created user: ${user.name} (${user.email}) - ${user.role}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
