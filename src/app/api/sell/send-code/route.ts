import { NextResponse } from "next/server";
import { isEmailConfigured, sendVerificationCodeEmail } from "@/lib/email";
import { connectMongo } from "@/lib/mongodb";
import { generateVerificationCode, hashVerificationCode, isValidEmail, normalizeEmail } from "@/lib/sell";
import { SellVerification } from "@/models/SellInquiry";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = normalizeEmail(body.email ?? "");
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email sending is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS." },
        { status: 503 }
      );
    }

    await connectMongo();
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await SellVerification.deleteMany({ email });
    await SellVerification.create({
      email,
      codeHash: hashVerificationCode(email, code),
      expiresAt,
      attempts: 0
    });

    await sendVerificationCodeEmail(email, code);

    return NextResponse.json({
      ok: true,
      email,
      message: "Verification code sent."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send verification code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
