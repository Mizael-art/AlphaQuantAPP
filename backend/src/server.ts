import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { registerPublicRoutes } from "./api/public/routes.js";
import { registerAdminRoutes } from "./api/admin/routes.js";
import { prisma } from "./db/client.js";

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail fast rather than silently running with an insecure default (spec section 80: never expose/weaken secrets).
  console.error("FATAL: JWT_SECRET is not set. Copy .env.example to .env and configure it.");
  process.exit(1);
}

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  credentials: true,
});
await app.register(cookie);
await app.register(jwt, {
  secret: JWT_SECRET,
  cookie: { cookieName: "aq_session", signed: false },
});

app.get("/api/health", async () => {
  const health = await prisma.systemHealth.findMany();
  return { status: "ok", services: health };
});

await registerPublicRoutes(app);
await app.register(async (adminScope) => {
  await registerAdminRoutes(adminScope);
});

app.setErrorHandler((error: Error & { statusCode?: number }, _req, reply) => {
  // Never mask errors (spec section 85): log full detail server-side, return a friendly message to the client.
  app.log.error(error);
  reply.status(error.statusCode ?? 500).send({
    error: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "production" ? "Something went wrong." : error.message,
  });
});

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  // Run the price-monitoring + performance-snapshot loops inside this same
  // process. Render's free plan only allows one running service, so instead
  // of requiring a second (paid) Background Worker, the worker module's
  // setInterval loops execute here — as long as this API instance is awake,
  // Bybit is polled every MONITORING_INTERVAL_MS (default 15s) and open
  // trades are checked for stop/TP hits automatically, not just when a
  // visitor loads the site. Set DISABLE_EMBEDDED_WORKER=1 if you later
  // deploy the worker as its own service and want to avoid running it twice.
  if (process.env.DISABLE_EMBEDDED_WORKER !== "1") {
    import("./workers/index.js").catch((err) => app.log.error({ err }, "failed to start embedded worker"));
  }
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
