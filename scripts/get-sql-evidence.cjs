const path = require('path');
const { execSync } = require('child_process');

const serverDir = path.resolve(__dirname, '../server');

function fetchRealSqlEvidence() {
  const result = execSync(`npx tsx -e '
    import "./src/env.ts";
    import { getPrisma } from "./src/prisma.ts";
    import { TicketStatus } from "@prisma/client";
    async function query() {
      const prisma = getPrisma();
      const staffUser = await prisma.user.findUnique({ where: { email: "e2e.staff@example.com" } });
      const requesterUser = await prisma.user.findUnique({ where: { email: "e2e.requester@example.com" } });
      const staffId = staffUser?.id || 14;
      const requesterId = requesterUser?.id || 10;

      const t0 = Date.now();

      // Staff Metrics
      const staffUnassignedPrisma = await prisma.ticket.count({
        where: { ownerId: null, currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] } }
      });
      const staffUnassignedRaw: any = await prisma.$queryRawUnsafe(
        "SELECT COUNT(*)::int AS count FROM \\"Ticket\\" WHERE \\"ownerId\\" IS NULL AND \\"currentStatus\\" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27);"
      );

      const staffOwnedPrisma = await prisma.ticket.count({
        where: { ownerId: staffId, currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] } }
      });
      const staffOwnedRaw: any = await prisma.$queryRawUnsafe(
        \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "ownerId" = \${staffId} AND "currentStatus" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27);\`
      );

      const staffAppearsResolvedPrisma = await prisma.ticket.count({
        where: { appearsResolved: true, currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] } }
      });
      const staffAppearsResolvedRaw: any = await prisma.$queryRawUnsafe(
        "SELECT COUNT(*)::int AS count FROM \\"Ticket\\" WHERE \\"appearsResolved\\" = true AND \\"currentStatus\\" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27);"
      );

      const staffPriorityPrisma = await prisma.ticket.count({
        where: { currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] } }
      });
      const staffPriorityRaw: any = await prisma.$queryRawUnsafe(
        "SELECT \\"itPriority\\", COUNT(*)::int AS count FROM \\"Ticket\\" WHERE \\"currentStatus\\" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27) GROUP BY \\"itPriority\\";"
      );

      // Requester Metrics
      const reqOpenPrisma = await prisma.ticket.count({
        where: { requesterId, currentStatus: { in: [TicketStatus.New, TicketStatus.Open, TicketStatus.Reopened] } }
      });
      const reqOpenRaw: any = await prisma.$queryRawUnsafe(
        \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" IN (\\x27New\\x27, \\x27Open\\x27, \\x27Reopened\\x27);\`
      );

      const reqInProgressPrisma = await prisma.ticket.count({
        where: { requesterId, currentStatus: TicketStatus.InProgress }
      });
      const reqInProgressRaw: any = await prisma.$queryRawUnsafe(
        \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27In Progress\\x27;\`
      );

      const reqWaitingPrisma = await prisma.ticket.count({
        where: { requesterId, currentStatus: TicketStatus.WaitingForRequester }
      });
      const reqWaitingRaw: any = await prisma.$queryRawUnsafe(
        \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27Waiting for Requester\\x27;\`
      );

      const reqResolvedPrisma = await prisma.ticket.count({
        where: { requesterId, currentStatus: TicketStatus.Resolved }
      });
      const reqResolvedRaw: any = await prisma.$queryRawUnsafe(
        \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27Resolved\\x27;\`
      );

      const reqClosedPrisma = await prisma.ticket.count({
        where: { requesterId, currentStatus: TicketStatus.Closed }
      });
      const reqClosedRaw: any = await prisma.$queryRawUnsafe(
        \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27Closed\\x27;\`
      );

      const queryDurationMs = Date.now() - t0;

      console.log("JSON_OUTPUT:" + JSON.stringify({
        executedAt: new Date().toISOString(),
        queryDurationMs,
        staff: [
          {
            name: "1. Unassigned Active Tickets (unassigned)",
            prismaCount: staffUnassignedPrisma,
            sqlCount: staffUnassignedRaw[0].count,
            sql: "SELECT COUNT(*)::int AS count FROM \\"Ticket\\" WHERE \\"ownerId\\" IS NULL AND \\"currentStatus\\" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27);",
            rawResult: staffUnassignedRaw
          },
          {
            name: "2. Assigned to Me Active Tickets (ownedByMe)",
            prismaCount: staffOwnedPrisma,
            sqlCount: staffOwnedRaw[0].count,
            sql: \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "ownerId" = \${staffId} AND "currentStatus" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27);\`,
            rawResult: staffOwnedRaw
          },
          {
            name: "3. Appears Resolved Active Tickets (appearsResolved)",
            prismaCount: staffAppearsResolvedPrisma,
            sqlCount: staffAppearsResolvedRaw[0].count,
            sql: "SELECT COUNT(*)::int AS count FROM \\"Ticket\\" WHERE \\"appearsResolved\\" = true AND \\"currentStatus\\" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27);",
            rawResult: staffAppearsResolvedRaw
          },
          {
            name: "4. Active Tickets Grouped By Priority (byPriority)",
            prismaCount: staffPriorityPrisma,
            sqlCount: staffPriorityRaw.reduce((acc: number, r: any) => acc + r.count, 0),
            sql: "SELECT \\"itPriority\\", COUNT(*)::int AS count FROM \\"Ticket\\" WHERE \\"currentStatus\\" NOT IN (\\x27Closed\\x27, \\x27Cancelled\\x27) GROUP BY \\"itPriority\\";",
            rawResult: staffPriorityRaw
          }
        ],
        requester: [
          {
            name: "1. Open Requests (openRequests)",
            prismaCount: reqOpenPrisma,
            sqlCount: reqOpenRaw[0].count,
            sql: \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" IN (\\x27New\\x27, \\x27Open\\x27, \\x27Reopened\\x27);\`,
            rawResult: reqOpenRaw
          },
          {
            name: "2. In Progress Requests (inProgress)",
            prismaCount: reqInProgressPrisma,
            sqlCount: reqInProgressRaw[0].count,
            sql: \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27In Progress\\x27;\`,
            rawResult: reqInProgressRaw
          },
          {
            name: "3. Waiting for Requester Requests (waitingForRequester)",
            prismaCount: reqWaitingPrisma,
            sqlCount: reqWaitingRaw[0].count,
            sql: \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27Waiting for Requester\\x27;\`,
            rawResult: reqWaitingRaw
          },
          {
            name: "4. Recently Resolved Requests (recentlyResolved)",
            prismaCount: reqResolvedPrisma,
            sqlCount: reqResolvedRaw[0].count,
            sql: \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27Resolved\\x27;\`,
            rawResult: reqResolvedRaw
          },
          {
            name: "5. Closed Requests (closed)",
            prismaCount: reqClosedPrisma,
            sqlCount: reqClosedRaw[0].count,
            sql: \`SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = \${requesterId} AND "currentStatus" = \\x27Closed\\x27;\`,
            rawResult: reqClosedRaw
          }
        ]
      }));
      await prisma.$disconnect();
    }
    query();
  '`, { cwd: serverDir, stdio: ['pipe', 'pipe', 'inherit'] });

  const output = result.toString().trim();
  const jsonLine = output.split('\n').find(l => l.startsWith('JSON_OUTPUT:'));
  return JSON.parse(jsonLine ? jsonLine.replace('JSON_OUTPUT:', '') : '{}');
}

if (require.main === module) {
  const data = fetchRealSqlEvidence();
  console.log(JSON.stringify(data, null, 2));
}

module.exports = { fetchRealSqlEvidence };

