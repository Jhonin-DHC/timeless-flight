import { NextResponse } from "next/server";
import { verifyAdminCredentials, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await verifyAdminCredentials(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await createSession(user.email);
    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
