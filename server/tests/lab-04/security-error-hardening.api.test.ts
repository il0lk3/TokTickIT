import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Security & Error Handling Hardening (Labsheet Section 8.5)", () => {
  it("rejects malformed JSON with HTTP 400 and structured JSON error message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{ malformed json: not valid }");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid JSON payload" });
  });

  it("returns structured JSON 404 for unknown /api/* routes", async () => {
    const res = await request(app).get("/api/unknown-nonexistent-endpoint-12345");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("does not leak X-Powered-By header", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("enforces authentication on write endpoints: unauthenticated requests are rejected with 401", async () => {
    // 1. Audit route prefixes: verify all registered write endpoints start with /api
    const registeredWriteRoutes: { method: string; path: string }[] = [];

    const inspectRouter = (router: any, basePath = "") => {
      if (!router || !router.stack) return;
      for (const layer of router.stack) {
        if (layer.route) {
          const subPath = layer.route.path === "/" ? "" : layer.route.path;
          const fullPath = (basePath + "/" + subPath).replace(/\/+/g, "/");
          const methods = Object.keys(layer.route.methods).filter((m) => ["post", "patch", "put", "delete"].includes(m));
          for (const method of methods) {
            registeredWriteRoutes.push({ method: method.toUpperCase(), path: fullPath });
          }
        } else if (layer.name === "router" && layer.handle) {
          let segment = "";
          if (layer.regexp && layer.regexp.source) {
            const raw = layer.regexp.source
              .replace(/^\\\^/, "")
              .replace(/\\\/\?\(\?=\\\/\|\$\)\/i?$/, "")
              .replace(/\\\/\?\(\?=\/\|\$\)/, "")
              .replace(/\(\?=\\\/\|\$\)/, "")
              .replace(/\\\//g, "/")
              .replace(/\\\:/g, ":")
              .replace(/[\^\$\?\(\)]/g, "");
            segment = raw.split("?=")[0];
          }
          const nestedBase = (basePath + "/" + segment).replace(/\/+/g, "/");
          inspectRouter(layer.handle, nestedBase);
        }
      }
    };

    inspectRouter((app as any)._router);
    expect(registeredWriteRoutes.length).toBeGreaterThan(0);
    const nonApi = registeredWriteRoutes.filter((r) => !r.path.startsWith("/api"));
    expect(nonApi).toEqual([]);

    // 2. Enforce auth guard: unauthenticated write requests must be rejected with 401
    const testEndpoints = [
      { method: "post", url: "/api/tickets", data: { title: "Hack", categoryId: 1, description: "Hack" } },
      { method: "patch", url: "/api/staff/tickets/1", data: { itPriority: "HIGH", expectedVersion: 1 } },
      { method: "post", url: "/api/tickets/1/actions-taken", data: { description: "Hack", result: "Hack" } },
      { method: "post", url: "/api/admin/users", data: { name: "Hacker", email: "hacker@example.com", role: "REQUESTER" } },
    ];

    for (const ep of testEndpoints) {
      const res = await (request(app) as any)[ep.method](ep.url).send(ep.data);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    }
  });
});
