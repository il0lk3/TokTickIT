import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("GET /api/categories", () => {
  it("returns the four seeded categories in id order", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    
    // Check that both id and name are present
    expect(res.body[0].id).toBeDefined();
    expect(res.body[0].name).toBe("Account and Access");
    
    expect(res.body[1].id).toBeDefined();
    expect(res.body[1].name).toBe("Hardware");
    
    expect(res.body[2].id).toBeDefined();
    expect(res.body[2].name).toBe("Software");
    
    expect(res.body[3].id).toBeDefined();
    expect(res.body[3].name).toBe("Network");
  });

  it("handles API error correctly (returns 404 for unknown endpoints)", async () => {
    const res = await request(app).get("/api/categories/unknown-error-path");
    expect(res.status).toBe(404);
  });
});
