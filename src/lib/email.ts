import nodemailer from "nodemailer";
import { SITE_NAME, SITE_PHONE_DISPLAY } from "@/lib/site";
import { SHIPPING_CARRIER_LABELS, trackingUrl, type ShippingCarrier } from "@/lib/shipping";

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

type OrderMailItem = {
  name: string;
  priceUsd: number;
  quantity: number;
};

type OrderMailAddress = {
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type OrderMailPayload = {
  customerName?: string;
  customerEmail: string;
  items: OrderMailItem[];
  subtotalUsd: number;
  discountUsd?: number;
  shippingUsd?: number;
  shippingLabel?: string;
  insuranceUsd?: number;
  insuranceLabel?: string;
  shippingAddress?: OrderMailAddress;
  totalUsd: number;
  couponCode?: string;
  carrier?: string;
  trackingNumber?: string;
};

function money(amount: number) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

function formatAddress(address?: OrderMailAddress) {
  if (!address?.line1) return "";
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(" ");
  return [address.line1, cityLine, address.country || "US"].filter(Boolean).join("\n");
}

function orderItemsText(items: OrderMailItem[]) {
  return items
    .map((item) => `${item.quantity} × ${item.name} — ${money(item.priceUsd)}`)
    .join("\n");
}

export async function sendOrderPaidEmail(order: OrderMailPayload) {
  if (!isEmailConfigured() || !order.customerEmail) return;

  const address = formatAddress(order.shippingAddress);
  const subject = `Order confirmed — ${SITE_NAME}`;
  const text = [
    `Thank you${order.customerName ? `, ${order.customerName}` : ""} for your purchase from ${SITE_NAME}.`,
    "",
    "Items:",
    orderItemsText(order.items),
    "",
    `Subtotal: ${money(order.subtotalUsd)}`,
    order.discountUsd ? `Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${money(order.discountUsd)}` : "",
    `Shipping${order.shippingLabel ? ` (${order.shippingLabel})` : ""}: ${money(order.shippingUsd || 0)}`,
    order.insuranceUsd
      ? `${order.insuranceLabel || "Insurance"}: ${money(order.insuranceUsd)}`
      : "",
    `Total: ${money(order.totalUsd)}`,
    "",
    address ? `Ship to:\n${address}` : "",
    "",
    "We will email tracking as soon as your watch ships.",
    `Questions: ${SITE_PHONE_DISPLAY}`
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
    .trim();

  await sendEmail({
    to: order.customerEmail,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <p>Thank you${order.customerName ? `, ${order.customerName}` : ""} for your purchase from ${SITE_NAME}.</p>
        <p><strong>Items</strong><br />${orderItemsText(order.items).replace(/\n/g, "<br />")}</p>
        <p>
          Subtotal: ${money(order.subtotalUsd)}<br />
          ${order.discountUsd ? `Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${money(order.discountUsd)}<br />` : ""}
          Shipping${order.shippingLabel ? ` (${order.shippingLabel})` : ""}: ${money(order.shippingUsd || 0)}<br />
          ${order.insuranceUsd ? `${order.insuranceLabel || "Insurance"}: ${money(order.insuranceUsd)}<br />` : ""}
          <strong>Total: ${money(order.totalUsd)}</strong>
        </p>
        ${address ? `<p><strong>Ship to</strong><br />${address.replace(/\n/g, "<br />")}</p>` : ""}
        <p>We will email tracking as soon as your watch ships.</p>
        <p style="color:#666;">Questions: ${SITE_PHONE_DISPLAY}</p>
      </div>
    `
  });
}

export async function sendOrderShippedEmail(order: OrderMailPayload) {
  if (!isEmailConfigured() || !order.customerEmail || !order.trackingNumber) return;

  const carrierKey = (order.carrier || "ups").toLowerCase();
  const carrierLabel = SHIPPING_CARRIER_LABELS[carrierKey as ShippingCarrier] || "UPS";
  const url = trackingUrl(carrierKey, order.trackingNumber);
  const address = formatAddress(order.shippingAddress);
  const subject = `Your watch has shipped — ${SITE_NAME}`;
  const text = [
    `Good news${order.customerName ? `, ${order.customerName}` : ""} — your order from ${SITE_NAME} is on the way.`,
    "",
    `Carrier: ${carrierLabel}`,
    `Tracking: ${order.trackingNumber}`,
    url ? `Track: ${url}` : "",
    "",
    address ? `Ship to:\n${address}` : "",
    "",
    `Questions: ${SITE_PHONE_DISPLAY}`
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
    .trim();

  await sendEmail({
    to: order.customerEmail,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <p>Good news${order.customerName ? `, ${order.customerName}` : ""} — your order from ${SITE_NAME} is on the way.</p>
        <p>
          <strong>Carrier:</strong> ${carrierLabel}<br />
          <strong>Tracking:</strong> ${order.trackingNumber}
        </p>
        ${url ? `<p><a href="${url}">Track your shipment</a></p>` : ""}
        ${address ? `<p><strong>Ship to</strong><br />${address.replace(/\n/g, "<br />")}</p>` : ""}
        <p style="color:#666;">Questions: ${SITE_PHONE_DISPLAY}</p>
      </div>
    `
  });
}

export async function sendVerificationCodeEmail(email: string, code: string) {
  const subject = "The Aviators Watch verification code";
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
