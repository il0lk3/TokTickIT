/*
  Warnings:

  - The `currentStatus` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `requestedPriority` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('New', 'In Progress', 'Resolved');

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "requestedPriority",
ADD COLUMN     "requestedPriority" "TicketPriority" NOT NULL,
DROP COLUMN "currentStatus",
ADD COLUMN     "currentStatus" "TicketStatus" NOT NULL DEFAULT 'New';

-- CreateIndex
CREATE INDEX "Attachment_ticketId_idx" ON "Attachment"("ticketId");

-- CreateIndex
CREATE INDEX "Ticket_requesterId_idx" ON "Ticket"("requesterId");

-- CreateIndex
CREATE INDEX "Ticket_categoryId_idx" ON "Ticket"("categoryId");

-- CreateIndex
CREATE INDEX "Ticket_relatedSystemId_idx" ON "Ticket"("relatedSystemId");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");
