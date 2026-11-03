const path = require('path');
const { execSync } = require('child_process');

const serverDir = path.resolve(__dirname, '../server');

function resetTestFixtures() {
  console.log('[reset-test-fixtures] Purging test clutter and resetting database to pristine seed...');
  execSync('npm run prisma:seed', { cwd: serverDir, stdio: 'pipe' });

  execSync(`npx tsx -e '
    import "./src/env.ts";
    import { getPrisma } from "./src/prisma.ts";
    import { TicketStatus, TicketPriority } from "@prisma/client";
    async function reset() {
      const prisma = getPrisma();
      
      // Clean clutter
      await prisma.actionTaken.deleteMany({
        where: {
          OR: [
            { ticketId: { gt: 9 } },
            { ticketId: 2 },
            { description: { startsWith: "Diagnostic sweep" } },
            { description: { startsWith: "E2E" } }
          ]
        }
      });
      await prisma.attachment.deleteMany({ where: { ticketId: { gt: 9 } } });
      await prisma.internalNote.deleteMany({ where: { ticketId: { gt: 9 } } });
      await prisma.publicComment.deleteMany({ where: { ticketId: { gt: 9 } } });
      await prisma.ticket.deleteMany({ where: { id: { gt: 9 } } });

      const e2eReq = await prisma.user.findUnique({ where: { email: "e2e.requester@example.com" } });
      const e2eStaff = await prisma.user.findUnique({ where: { email: "e2e.staff@example.com" } });
      const staff2 = await prisma.user.findUnique({ where: { email: "staff2@example.com" } });
      const staff3 = await prisma.user.findUnique({ where: { email: "staff3@example.com" } });

      const reqId = e2eReq?.id || 10;
      const s1 = e2eStaff?.id || 14;
      const s2 = staff2?.id || 12;
      const s3 = staff3?.id || 13;

      // Assign e2e.requester to tickets across each core status for 100% dashboard drill-down coverage
      await prisma.ticket.update({
        where: { id: 1 },
        data: { currentStatus: TicketStatus.InProgress, ownerId: s1, requesterId: reqId, appearsResolved: false, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 2 },
        data: { currentStatus: TicketStatus.Open, ownerId: null, requesterId: reqId, appearsResolved: false, itPriority: TicketPriority.HIGH, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 3 },
        data: { currentStatus: TicketStatus.Closed, ownerId: s1, requesterId: reqId, appearsResolved: false, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 4 },
        data: { currentStatus: TicketStatus.Open, ownerId: s2, appearsResolved: false, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 5 },
        data: { currentStatus: TicketStatus.WaitingForRequester, ownerId: s3, requesterId: reqId, appearsResolved: false, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 6 },
        data: { currentStatus: TicketStatus.Resolved, ownerId: s1, requesterId: reqId, appearsResolved: false, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 7 },
        data: { currentStatus: TicketStatus.Reopened, ownerId: s2, appearsResolved: false, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 8 },
        data: { currentStatus: TicketStatus.Cancelled, ownerId: null, appearsResolved: false, version: 1 }
      });
      await prisma.ticket.update({
        where: { id: 9 },
        data: { currentStatus: TicketStatus.InProgress, ownerId: s3, appearsResolved: true, version: 1 }
      });

      await prisma.$disconnect();
    }
    reset();
  '`, { cwd: serverDir, stdio: 'pipe' });

  console.log('[reset-test-fixtures] Pristine seed state restored successfully.');
}

if (require.main === module) {
  resetTestFixtures();
}

module.exports = { resetTestFixtures };
