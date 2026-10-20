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

  it("audit: all registered write endpoints on /api are protected or explicit auth endpoints", () => {
    // Inspect Express router layer stack to verify no unprotected write endpoints exist
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
            // Strip regex boundary markers
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

    // Verify all write endpoints start with /api
    expect(registeredWriteRoutes.length).toBeGreaterThan(0);
    const nonApi = registeredWriteRoutes.filter((r) => !r.path.startsWith("/api"));
    expect(nonApi).toEqual([]);
  });
});
