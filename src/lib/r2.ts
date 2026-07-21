import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET are required.");
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function getPublicBaseUrl() {
  const configured = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  throw new Error("R2_PUBLIC_BASE_URL is required to serve uploaded images publicly.");
}

function sanitizeFilename(filename: string) {
  return filename.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-");
}

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE_URL
  );
}

async function assertPublicImageReachable(url: string) {
  const help =
    "Enable public access on the R2 bucket and confirm R2_PUBLIC_BASE_URL matches the bucket’s public r2.dev (or custom) URL.";

  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (head.ok) return;

    const ranged = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Range: "bytes=0-0" }
    });
    if (ranged.ok || ranged.status === 206) return;

    throw new Error(`Upload succeeded, but the public image URL returned HTTP ${ranged.status}. ${help}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Upload succeeded")) {
      throw error;
    }
    throw new Error(`Upload succeeded, but the public image URL is not reachable. ${help}`);
  }
}

export async function uploadListingImage(file: File) {
  const { accountId, accessKeyId, secretAccessKey, bucket } = getR2Config();
  const publicBaseUrl = getPublicBaseUrl();

  if (/pub-your-id\.r2\.dev/i.test(publicBaseUrl)) {
    throw new Error("R2_PUBLIC_BASE_URL is still a placeholder. Set your real Cloudflare R2 public URL.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const key = `listings/${randomUUID()}-${sanitizeFilename(file.name || `watch.${extension}`)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable"
      })
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown R2 error";
    throw new Error(`R2 upload failed: ${detail}`);
  }

  const url = `${publicBaseUrl}/${key}`;
  await assertPublicImageReachable(url);

  return { key, url };
}
