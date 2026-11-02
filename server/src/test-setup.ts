import "./env.js";
import http from "http";
import { app } from "./app.js";
import { afterAll } from "vitest";

// In test environment, bind a single persistent HTTP server for Supertest to prevent
// ephemeral port cycling from colliding with local proxy ports (52000-65000).
let testServer: http.Server | null = null;
const origCreateServer = http.createServer;

http.createServer = function (...args: any[]) {
  if (args[0] === app) {
    if (!testServer) {
      testServer = origCreateServer.apply(http, args as any);
      testServer.listen(0, "127.0.0.1");
    }
    return testServer;
  }
  return origCreateServer.apply(http, args as any);
};

// Start and verify listening on 127.0.0.1 before tests begin
if (!testServer) {
  testServer = origCreateServer.call(http, app);
  await new Promise<void>((resolve, reject) => {
    testServer!.listen(0, "127.0.0.1", () => resolve());
    testServer!.once("error", reject);
  });
}

afterAll(async () => {
  if (testServer && testServer.listening) {
    await new Promise<void>((resolve) => {
      testServer!.close(() => resolve());
    });
  }
});
