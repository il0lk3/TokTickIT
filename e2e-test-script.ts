import { getPrisma } from './server/src/prisma.js';
(async () => {
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: 'TKT-2026-000002' } });
  console.log("Current ticket status:", ticket?.currentStatus);
  console.log("Current ticket ownerId:", ticket?.ownerId);

  // Get notes
  const notes = await prisma.internalNote.findMany({ where: { ticketId: ticket?.id } });
  console.log("Notes count:", notes.length);
  if (notes.length > 0) {
    console.log("Last note:", notes[notes.length - 1].content);
  }
})();
