import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getPrisma } from "./prisma.js";
// getPrisma() is your lazy database handle. Call it INSIDE a route when you
// need the DB (Issue 4). It is intentionally unused until then.
void getPrisma;

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors({ origin: true, credentials: true })); // allow cookies
app.use(express.json());
app.use(cookieParser());

import { authRouter } from "./routes/auth.js";
app.use("/api/auth", authRouter);

import ticketsRouter from "./routes/tickets.js";
app.use("/api/tickets", ticketsRouter);

import staffRouter from "./routes/staff.js";
app.use("/api/staff", staffRouter);

import adminRouter from "./routes/admin.js";
app.use("/api/admin", adminRouter);

// ---------------------------------------------------------------------------
// Issue 2 — API health check
// Make the test in tests/lab-01/health.test.ts pass.
// It must return HTTP 200 with JSON: { status: "ok", service: "TokTickIT API" }
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Issue 4 — Category list
// Add:  GET /api/categories
//   -> read categories from PostgreSQL via getPrisma().category.findMany(...)
//   -> return each { id, name } in a predictable (id) order
//   -> on failure, respond 500 with a safe message (no internal details)
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// Issue 3 — Requesters list
// ---------------------------------------------------------------------------
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().user.findMany({
      where: { isActive: true, role: 'REQUESTER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(requesters);
  } catch (error) {
    console.error("Failed to fetch requesters:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

import { authenticateToken, requireRole } from "./middleware/auth.js";

app.get("/api/it-staff", authenticateToken, requireRole(["IT_STAFF"]), async (_req: Request, res: Response) => {
  try {
    const staff = await getPrisma().user.findMany({
      where: { isActive: true, role: 'IT_STAFF' },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(staff);
  } catch (error) {
    console.error("Failed to fetch IT staff:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error("Failed to fetch systems:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
