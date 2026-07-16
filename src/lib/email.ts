import nodemailer from "nodemailer";

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getFromAddress() {
  return process.env.SMTP_FROM?.trim() || process.env.SMTP_USER || "noreply@timelessflight.com";
}

function createTransport() {
  if (!isEmailConfigured()) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const transport = createTransport();
  const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;

  await transport.sendMail({
    from: getFromAddress(),
    to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text.replace(/\n/g, "<br />"),
    replyTo: options.replyTo
  });
}

export function getTeamNotifyEmails() {
  const configured = process.env.SELL_NOTIFY_EMAILS || process.env.ADMIN_EMAIL || "";
  return configured
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function sendSellInquiryAlert(inquiry: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
  country: string;
  zipCode: string;
  description: string;
  photoUrls: string[];
}) {
  const recipients = getTeamNotifyEmails();
  if (recipients.length === 0) {
    throw new Error("No team notify emails configured (SELL_NOTIFY_EMAILS or ADMIN_EMAIL).");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://timeless-flight.vercel.app";
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin/sell-inquiries`;
  const photoList =
    inquiry.photoUrls.length > 0
      ? inquiry.photoUrls.map((url, index) => `${index + 1}. ${url}`).join("\n")
      : "No photos uploaded.";

  const subject = `New sell inquiry — ${inquiry.firstName} ${inquiry.lastName}`;
  const text = [
    "A new sell your watch inquiry was submitted.",
    "",
    `Name: ${inquiry.firstName} ${inquiry.lastName}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phoneCountryCode} ${inquiry.phone}`,
    `Location: ${inquiry.country} ${inquiry.zipCode}`,
    "",
    "Description:",
    inquiry.description || "(none)",
    "",
    "Photos:",
    photoList,
    "",
    `Review in admin: ${adminUrl}`,
    `Inquiry ID: ${inquiry.id}`
  ].join("\n");

  await sendEmail({
    to: recipients,
    subject,
    text,
    replyTo: inquiry.email
  });
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const subject = "Your Timeless Flight verification code";
  const text = [
    "Use this verification code to continue your sell inquiry:",
    "",
    code,
    "",
    "This code expires in 15 minutes.",
    "If you did not request this, you can ignore this email."
  ].join("\n");

  await sendEmail({
    to: email,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <p>Use this verification code to continue your sell inquiry:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 15 minutes.</p>
        <p style="color:#666;">If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
}
