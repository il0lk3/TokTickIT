import { describe, it, expect } from "vitest";
import { getPrisma } from "../../src/prisma.js";

describe("DB-01: Migration & Seed Validation", () => {
  const prisma = getPrisma();

  it("should have migrated Users with correct roles and fields", async () => {
    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThan(0);
    
    // Check that there is at least one REQUESTER, IT_STAFF, and ADMINISTRATOR
    const roles = users.map(u => u.role);
    expect(roles).toContain("REQUESTER");
    expect(roles).toContain("IT_STAFF");
    expect(roles).toContain("ADMINISTRATOR");

    // Check that they have requiresPasswordChange and passwordHash
    expect(users[0]).toHaveProperty("requiresPasswordChange");
    expect(users[0]).toHaveProperty("passwordHash");
  });

  it("should have tickets with itPriority field", async () => {
    const ticket = await prisma.ticket.findFirst();
    if (ticket) {
      expect(ticket).toHaveProperty("itPriority");
    }
  });

  it("should support PublicComment and InternalNote relations", async () => {
    const comments = await prisma.publicComment.findMany({ take: 1, include: { author: true } });
    if (comments.length > 0) {
      expect(comments[0].author).toBeDefined();
    }
  });
});
