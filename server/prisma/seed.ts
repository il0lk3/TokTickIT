import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories
  const categories = ["Account and Access", "Hardware", "Software", "Network"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Seed Related Systems
  const systems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
    "Student Registration",
    "Library Portal"
  ];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Seed Development Requesters
  const requesters = [
    { email: "cream.su@example.com", name: "Cream Su", isActive: true },
    { email: "bew.su@example.com", name: "Bew Su", isActive: true },
    { email: "kanta.su@example.com", name: "Kanta Su", isActive: true },
    { email: "je.su@example.com", name: "Je Su", isActive: true },
    { email: "bewnoi.su@example.com", name: "Bewnoi Su", isActive: true },
    { email: "grace.su@example.com", name: "Grace Su", isActive: true },
    { email: "phrao.su@example.com", name: "Phrao Su", isActive: true },
    { email: "pueng.su@example.com", name: "Pueng Su", isActive: true },
    { email: "inactive.user@example.com", name: "Inactive TestUser", isActive: false },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: { name: req.name, isActive: req.isActive },
      create: req,
    });
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
