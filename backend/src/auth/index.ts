import argon2 from "argon2";
import type { FastifyReply, FastifyRequest } from "fastify";

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * Fastify preHandler that enforces admin authentication.
 * Backend-side check ONLY — never trust the frontend for authorization
 * (spec section 79: "Backend deve verificar autenticação").
 */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ error: "UNAUTHORIZED", message: "Valid admin session required" });
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; email: string; role: string };
    user: { sub: string; email: string; role: string };
  }
}
