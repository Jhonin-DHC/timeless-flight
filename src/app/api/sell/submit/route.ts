import { NextResponse } from "next/server";
import { isEmailConfigured, sendSellInquiryAlert } from "@/lib/email";
import { connectMongo } from "@/lib/mongodb";
import { isValidEmail, normalizeEmail } from "@/lib/sell";
import { SellInquiry } from "@/models/SellInquiry";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      emailVerified?: boolean;
      description?: string;
      photoUrls?: string[];
      firstName?: string;
      lastName?: string;
      phone?: string;
      phoneCountryCode?: string;
      country?: string;
      zipCode?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!body.emailVerified) {
      return NextResponse.json({ error: "Please verify your email before submitting." }, { status: 400 });
    }
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.phone?.trim() || !body.zipCode?.trim()) {
      return NextResponse.json({ error: "Contact details are incomplete." }, { status: 400 });
    }

    const photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls.filter(Boolean).slice(0, 5) : [];

    await connectMongo();
    const inquiry = await SellInquiry.create({
      email,
      emailVerifiedAt: new Date(),
      description: body.description?.trim() ?? "",
      photoUrls,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      phone: body.phone.trim(),
      phoneCountryCode: body.phoneCountryCode?.trim() || "+1",
      country: body.country?.trim() || "United States",
      zipCode: body.zipCode.trim(),
      status: "new",
      isUnread: true,
      replies: []
    });

    let emailQueued = false;
    let emailError: string | null = null;
    if (isEmailConfigured()) {
      try {
        await sendSellInquiryAlert({
          id: inquiry._id.toString(),
          email,
          firstName: inquiry.firstName,
          lastName: inquiry.lastName,
          phone: inquiry.phone,
          phoneCountryCode: inquiry.phoneCountryCode,
          country: inquiry.country,
          zipCode: inquiry.zipCode,
          description: inquiry.description,
          photoUrls: inquiry.photoUrls
        });
        emailQueued = true;
      } catch (error) {
        emailError = error instanceof Error ? error.message : "Team email failed.";
        console.error("Sell inquiry team email failed:", emailError);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        id: inquiry._id.toString(),
        emailQueued,
        emailError
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit inquiry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
