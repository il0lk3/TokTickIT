import "./env.js";
import http from "http";
import { app } from "./app.js";
import { afterAll } from "vitest";

// In the test environment, Supertest's `request(app)` normally wraps the app in a
// brand-new ephemeral HTTP server for EVERY request (http.createServer(app) +
// listen(0)). Hundreds of short-lived ports can collide with other local
// listeners (e.g. a local proxy daemon) and return foreign responses.
// We bind ONE persistent server on 127.0.0.1 and hand it to Supertest only.
// Explicit `app.listen()` calls made by individual tests are left untouched so
// they cannot close the shared server.
const origCreateServer = http.createServer;

const testServer: http.Server = origCreateServer.call(http, app);
await new Promise<void>((resolve, reject) => {
  testServer.once("error", reject);
  testServer.listen(0, "127.0.0.1", () => resolve());
});

http.createServer = function (this: unknown, ...args: any[]) {
  const calledFromSupertest = new Error().stack?.includes("supertest") ?? false;
  if (args[0] === app && calledFromSupertest && testServer.listening) {
    return testServer;
  }
  return origCreateServer.apply(http, args as any);
} as typeof http.createServer;

afterAll(async () => {
  if (testServer.listening) {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  }
});
