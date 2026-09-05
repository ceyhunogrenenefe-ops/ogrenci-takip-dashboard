import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./types";

export type SessionUser = {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: Role;
};

function secret() {
  const s = process.env.JWT_SECRET || "dev-secret";
  return new TextEncoder().encode(s);
}

export async function signToken(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      companyId: String(payload.companyId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
