import { CartItem } from "@/components/cart-provider";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

function getClientId() {
  return process.env.NEXT_PUBLIC_STOREFRONT_CLIENT_ID ?? "timeless-flight";
}

function createStorefrontUrl(pathSuffix: string) {
  const base = getBaseUrl().replace(/\/$/, "");
  const clientId = getClientId();
  return `${base}/storefront/${clientId}${pathSuffix}`;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected storefront error.";
}

async function parseJsonResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (payload as { message?: string; error?: string })?.message ??
      (payload as { message?: string; error?: string })?.error ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload as Record<string, unknown>;
}

export interface ValidateCouponInput {
  code: string;
  cartTotal: number;
  items: Array<Pick<CartItem, "name" | "price" | "quantity">>;
  customerEmail?: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  discountAmount: number;
  code: string;
  message?: string;
}

export async function validateCoupon(input: ValidateCouponInput): Promise<ValidateCouponResult> {
  const url = createStorefrontUrl("/coupon/validate");
  const body = {
    code: input.code.toUpperCase(),
    cartTotal: input.cartTotal,
    items: input.items,
    ...(input.customerEmail ? { customerEmail: input.customerEmail } : {})
  };

  console.info("[storefront] validating coupon", { url, body });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await parseJsonResponse(response);
    console.info("[storefront] coupon validate response", payload);

    const rawValid = payload.valid;
    const discountAmount = Number(payload.discountAmount ?? payload.discount ?? 0);
    const valid = typeof rawValid === "boolean" ? rawValid : discountAmount > 0;
    const message = typeof payload.message === "string" ? payload.message : undefined;

    if (!valid) {
      throw new Error(message ?? "Coupon is invalid.");
    }

    return {
      valid,
      discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
      code: input.code.toUpperCase(),
      message
    };
  } catch (error) {
    const message = toErrorMessage(error);
    if (message.toLowerCase().includes("failed to fetch")) {
      throw new Error("Network/CORS issue while validating coupon. Verify NEXT_PUBLIC_API_BASE_URL and CORS.");
    }
    throw error;
  }
}

export interface CheckoutInput {
  items: CartItem[];
  customerEmail: string;
  customerName: string;
  couponCode?: string;
  referralEmail?: string;
}

function extractPaymentUrl(payload: Record<string, unknown>) {
  const directUrl = payload.paymentUrl;
  const directLink = payload.paymentLink;
  const data = payload.data as Record<string, unknown> | undefined;
  const nestedUrl = data?.paymentUrl;
  const nestedLink = data?.paymentLink;

  return [directUrl, directLink, nestedUrl, nestedLink].find((value) => typeof value === "string") as
    | string
    | undefined;
}

async function confirmCheckout(checkoutId: string) {
  const url = createStorefrontUrl("/checkout/confirm");
  const body = { checkoutId };
  console.info("[storefront] confirming checkout", { url, body });
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await parseJsonResponse(response);
  console.info("[storefront] checkout confirm response", payload);
  return extractPaymentUrl(payload);
}

export async function createCheckout(input: CheckoutInput): Promise<string> {
  const url = createStorefrontUrl("/checkout");
  const body = {
    items: input.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    ...(input.couponCode ? { couponCode: input.couponCode.toUpperCase() } : {}),
    ...(input.referralEmail ? { referralEmail: input.referralEmail } : {})
  };

  console.info("[storefront] creating checkout", { url, body });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await parseJsonResponse(response);
    console.info("[storefront] checkout response", payload);

    let paymentUrl = extractPaymentUrl(payload);
    if (!paymentUrl) {
      const checkoutId = payload.checkoutId ?? (payload.data as Record<string, unknown> | undefined)?.checkoutId;
      if (typeof checkoutId === "string" && checkoutId.length > 0) {
        paymentUrl = await confirmCheckout(checkoutId);
      }
    }

    if (!paymentUrl) {
      throw new Error("Checkout succeeded but response did not contain paymentUrl/paymentLink.");
    }

    return paymentUrl;
  } catch (error) {
    const message = toErrorMessage(error);
    if (message.toLowerCase().includes("failed to fetch")) {
      throw new Error("Network/CORS issue during checkout. Verify API URL, CORS, and endpoint path.");
    }
    throw error;
  }
}
