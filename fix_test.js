const fs = require('fs');
let p = '/Users/karn/Downloads/toktickit/server/tests/lab-03/staff-ticket-detail.api.test.ts';
let c = fs.readFileSync(p, 'utf8');
if (!c.includes('afterAll')) {
  c = c.replace(/import \{ describe, it, expect, beforeAll \} from "vitest";/, 'import { describe, it, expect, beforeAll, afterAll } from "vitest";');
  c = c.replace(/describe\("IT Staff Ticket Detail API", \(\) => \{/, 'describe("IT Staff Ticket Detail API", () => {\n  const prisma = getPrisma();');
  // we already have const prisma inside beforeAll, let's just add afterAll at the end of describe
  c = c.replace(/  \}\);\n\}\);/, '  });\n\n  afterAll(async () => {\n    await prisma.ticket.deleteMany({ where: { id: ticketId }});\n    await prisma.user.deleteMany({ where: { id: { in: [requesterId, staffId, adminId] } }});\n  });\n});');
  fs.writeFileSync(p, c);
}
console.log('Fixed API test cleanup');
