sohkimport { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Grace Su
  const grace = await prisma.requesterUser.findUnique({
    where: { email: "grace.su@example.com" }
  });

  if (!grace) {
    console.error("Grace Su not found!");
    return;
  }

  // Find categories and systems
  const categories = await prisma.category.findMany();
  const systems = await prisma.relatedSystem.findMany();

  if (!categories.length || !systems.length) {
    console.error("No categories or systems found. Run seed first.");
    return;
  }

  // Sample data
  const summaries = [
    "Cannot access university email",
    "Wi-Fi keeps disconnecting in building 4",
    "VPN connection fails with error 809",
    "LEB2 App crashes on login",
    "Unable to submit grades for section 3",
    "Printer in common room is out of toner",
    "Corporate laptop is overheating",
    "Library portal shows 404 for journal articles",
    "Student registration page is extremely slow",
    "Need software license for Adobe Creative Cloud",
    "Mouse is not working properly",
    "Monitor flickers randomly",
    "Forgot password for main system",
    "Requesting access to shared drive",
    "Antivirus software needs update"
  ];

  const priorities = ["LOW", "MEDIUM", "HIGH"];
  const statuses = ["New", "InProgress", "Resolved"];

  let count = 0;
  for (const summary of summaries) {
    count++;
    
    // Generate a random ticket number
    const dateStr = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 900000) + 100000;
    const ticketNumber = `TKT-${dateStr}-${sequence}`;

    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const randomSys = systems[Math.floor(Math.random() * systems.length)];
    const randomPri = priorities[Math.floor(Math.random() * priorities.length)];
    const randomStat = statuses[Math.floor(Math.random() * statuses.length)];

    await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: grace.id,
        categoryId: randomCat.id,
        relatedSystemId: randomSys.id,
        summary,
        description: `This is a randomly generated description for the issue: ${summary}. Please investigate.`,
        requestedPriority: randomPri,
        currentStatus: randomStat,
        createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) // Random date in last 10 days
      }
    });
  }

  console.log(`Seeded ${count} tickets for Grace Su!`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
