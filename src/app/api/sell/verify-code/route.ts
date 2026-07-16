import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { hashVerificationCode, isValidEmail, normalizeEmail } from "@/lib/sell";
import { SellVerification } from "@/models/SellInquiry";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = normalizeEmail(body.email ?? "");
    const code = String(body.code ?? "").trim();

    if (!isValidEmail(email) || !/^\d{4,8}$/.test(code)) {
      return NextResponse.json({ error: "Enter a valid email and verification code." }, { status: 400 });
    }

    await connectMongo();
    const record = await SellVerification.findOne({ email }).sort({ createdAt: -1 });
    if (!record) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    if (record.attempts >= 5) {
      return NextResponse.json({ error: "Too many attempts. Please request a new code." }, { status: 429 });
    }

    const valid = record.codeHash === hashVerificationCode(email, code);
    if (!valid) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
    }

    await SellVerification.deleteMany({ email });
    return NextResponse.json({ ok: true, email, verified: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
