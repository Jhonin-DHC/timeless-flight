import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { isValidEmail, normalizeEmail } from "@/lib/sell";
import { SellInquiry } from "@/models/SellInquiry";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      description?: string;
      photoUrls?: string[];
      firstName?: string;
      lastName?: string;
      phone?: string;
      phoneCountryCode?: string;
      country?: string;
      zipCode?: string;
      privacyAccepted?: boolean;
    };

    const email = normalizeEmail(body.email ?? "");
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.phone?.trim() || !body.zipCode?.trim()) {
      return NextResponse.json({ error: "Contact details are incomplete." }, { status: 400 });
    }
    if (!body.privacyAccepted) {
      return NextResponse.json({ error: "Please accept the privacy policy to continue." }, { status: 400 });
    }

    await connectMongo();
    const inquiry = await SellInquiry.create({
      email,
      description: body.description?.trim() ?? "",
      photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls.slice(0, 12) : [],
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phone: body.phone.trim(),
      phoneCountryCode: body.phoneCountryCode?.trim() || "+1",
      country: body.country?.trim() || "United States",
      zipCode: body.zipCode.trim(),
      privacyAccepted: true,
      status: "submitted"
    });

    return NextResponse.json({ ok: true, id: inquiry._id.toString() }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit inquiry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
