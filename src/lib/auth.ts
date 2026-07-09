import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";

const SESSION_COOKIE = "tf_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required.");
  }
  return new TextEncoder().encode(secret);
}

export async function ensureAdminUser() {
  await connectMongo();
  const existing = await AdminUser.findOne();
  if (existing) return existing;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin user.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return AdminUser.create({ email: email.toLowerCase(), passwordHash });
}

export async function verifyAdminCredentials(email: string, password: string) {
  await connectMongo();
  await ensureAdminUser();
  const user = await AdminUser.findOne({ email: email.toLowerCase() });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function createSession(email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionEmail() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, getAuthSecret, SESSION_MAX_AGE };
