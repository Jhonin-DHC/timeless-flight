import { revalidatePath } from "next/cache";
import { extractCoverImage } from "@/lib/blog-cover";
import { defaultBlogLocale } from "@/lib/blog-locale";
import { estimateReadingMinutes, slugifyBlogTitle } from "@/lib/blog-slug";
import {
  BLOG_CATEGORY_LABELS,
  BLOG_LOCALE,
  isBlogCategory,
  isBlogStatus,
  publicBlogPath,
  type AdminBlog,
  type BlogCategory,
  type BlogLocale,
  type BlogStatus,
  type PublicBlog
} from "@/lib/blog-types";
import { connectMongo } from "@/lib/mongodb";
import { BlogPost } from "@/models/BlogPost";
import { blogs as staticBlogs } from "@/data/blogs";

export interface BlogPayload {
  slug?: string;
  locale?: string;
  translationOf?: string;
  title?: string;
  summary?: string;
  category?: string;
  body?: string;
  status?: string;
  publishedAt?: string | null;
}

function asDateIso(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function coverFromBody(body: string) {
  return extractCoverImage(body);
}

function toAdminBlog(doc: {
  _id: unknown;
  slug: string;
  locale?: string;
  translationOf?: string;
  title: string;
  summary?: string;
  category: string;
  body?: string;
  status: string;
  publishedAt?: Date | string | null;
  readingMinutes?: number;
  updatedByEmail?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}): AdminBlog {
  const body = doc.body || "";
  const cover = coverFromBody(body);
  const category = isBlogCategory(doc.category) ? doc.category : "buying-guides";
  return {
    id: String(doc._id),
    slug: doc.slug,
    locale: BLOG_LOCALE,
    translationOf: doc.translationOf || "",
    title: doc.title,
    summary: doc.summary || "",
    category,
    body,
    status: isBlogStatus(doc.status) ? doc.status : "draft",
    publishedAt: asDateIso(doc.publishedAt),
    readingMinutes: doc.readingMinutes || estimateReadingMinutes(body),
    updatedByEmail: doc.updatedByEmail || "",
    coverUrl: cover.url,
    coverAlt: cover.alt,
    createdAt: asDateIso(doc.createdAt),
    updatedAt: asDateIso(doc.updatedAt)
  };
}

function toPublicBlog(post: AdminBlog): PublicBlog {
  return {
    slug: post.slug,
    locale: BLOG_LOCALE,
    title: post.title,
    summary: post.summary,
    category: post.category,
    categoryLabel: BLOG_CATEGORY_LABELS[post.category],
    body: post.body,
    publishedAt: post.publishedAt,
    readingMinutes: post.readingMinutes,
    coverUrl: post.coverUrl,
    coverAlt: post.coverAlt
  };
}

function staticAsPublic(): PublicBlog[] {
  return staticBlogs.map((post) => {
    const category = isBlogCategory(post.category) ? post.category : "buying-guides";
    const body = post.body || post.excerpt;
    const cover = coverFromBody(body);
    return {
      slug: post.slug,
      locale: BLOG_LOCALE,
      title: post.title,
      summary: post.excerpt,
      category,
      categoryLabel: BLOG_CATEGORY_LABELS[category],
      body,
      publishedAt: null,
      readingMinutes: estimateReadingMinutes(body),
      coverUrl: cover.url,
      coverAlt: cover.alt
    };
  });
}

export function validateBlogPayload(input: BlogPayload) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) return { error: "Title is required." };

  const slug = slugifyBlogTitle(typeof input.slug === "string" && input.slug.trim() ? input.slug : title);
  if (!slug) return { error: "Slug is required." };

  const category = typeof input.category === "string" ? input.category : "buying-guides";
  if (!isBlogCategory(category)) return { error: "Choose a valid category." };

  const status = typeof input.status === "string" ? input.status : "draft";
  if (!isBlogStatus(status)) return { error: "Status must be draft or published." };

  const body = typeof input.body === "string" ? input.body : "";
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  const locale: BlogLocale = defaultBlogLocale();
  const translationOf = typeof input.translationOf === "string" ? input.translationOf.trim() : "";

  let publishedAt: Date | null = null;
  if (input.publishedAt) {
    const parsed = new Date(input.publishedAt);
    if (Number.isNaN(parsed.getTime())) return { error: "Publish date is invalid." };
    publishedAt = parsed;
  } else if (status === "published") {
    publishedAt = new Date();
  }

  return {
    value: {
      slug,
      locale,
      translationOf,
      title,
      summary,
      category,
      body,
      status,
      publishedAt,
      readingMinutes: estimateReadingMinutes(body)
    }
  };
}

function duplicateSlugError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? Number((error as { code?: number }).code) : 0;
  return code === 11000;
}

function revalidateBlogPaths(slug?: string) {
  revalidatePath("/resources/blogs");
  if (slug) revalidatePath(publicBlogPath(slug));
}

export async function listAdminBlogs() {
  await connectMongo();
  const docs = await BlogPost.find().sort({ updatedAt: -1 }).lean();
  return docs.map((doc) => toAdminBlog(doc));
}

export async function getAdminBlogBySlug(slug: string, locale: BlogLocale = BLOG_LOCALE) {
  await connectMongo();
  const doc = await BlogPost.findOne({ slug, locale }).lean();
  return doc ? toAdminBlog(doc) : null;
}

export async function createBlogPost(input: BlogPayload, updatedByEmail = "") {
  const parsed = validateBlogPayload(input);
  if ("error" in parsed && parsed.error) return { error: parsed.error };
  const value = parsed.value;
  if (!value) return { error: "Invalid post." };

  await connectMongo();
  try {
    const doc = await BlogPost.create({ ...value, updatedByEmail });
    revalidateBlogPaths(value.slug);
    return { post: toAdminBlog(doc.toObject()) };
  } catch (error) {
    if (duplicateSlugError(error)) return { error: "A post with this slug already exists." };
    throw error;
  }
}

export async function updateBlogPost(currentSlug: string, input: BlogPayload, updatedByEmail = "") {
  const parsed = validateBlogPayload(input);
  if ("error" in parsed && parsed.error) return { error: parsed.error };
  const value = parsed.value;
  if (!value) return { error: "Invalid post." };

  await connectMongo();
  const locale = value.locale;
  try {
    const doc = await BlogPost.findOneAndUpdate(
      { slug: currentSlug, locale },
      { ...value, updatedByEmail },
      { new: true }
    ).lean();
    if (!doc) return { error: "Post not found." };
    revalidateBlogPaths(currentSlug);
    if (value.slug !== currentSlug) revalidateBlogPaths(value.slug);
    return { post: toAdminBlog(doc) };
  } catch (error) {
    if (duplicateSlugError(error)) return { error: "A post with this slug already exists." };
    throw error;
  }
}

export async function deleteBlogPost(slug: string, locale: BlogLocale = BLOG_LOCALE) {
  await connectMongo();
  const doc = await BlogPost.findOneAndDelete({ slug, locale }).lean();
  if (!doc) return { error: "Post not found." };
  revalidateBlogPaths(slug);
  return { ok: true as const };
}

export async function bulkSetBlogStatus(items: Array<{ slug: string; locale?: string }>, status: BlogStatus) {
  await connectMongo();
  const publishedAt = status === "published" ? new Date() : null;
  const slugs: string[] = [];
  for (const item of items) {
    const locale = item.locale === "es" ? "es" : BLOG_LOCALE;
    const update: { status: BlogStatus; publishedAt?: Date | null } = { status };
    if (status === "published") update.publishedAt = publishedAt;
    if (status === "draft") update.publishedAt = null;
    const doc = await BlogPost.findOneAndUpdate({ slug: item.slug, locale }, update, { new: true }).lean();
    if (doc) slugs.push(item.slug);
  }
  revalidatePath("/resources/blogs");
  for (const slug of slugs) revalidatePath(publicBlogPath(slug));
  return { ok: true as const, count: slugs.length };
}

export async function bulkDeleteBlogPosts(items: Array<{ slug: string; locale?: string }>) {
  await connectMongo();
  let count = 0;
  for (const item of items) {
    const locale = item.locale === "es" ? "es" : BLOG_LOCALE;
    const doc = await BlogPost.findOneAndDelete({ slug: item.slug, locale }).lean();
    if (doc) {
      count += 1;
      revalidateBlogPaths(item.slug);
    }
  }
  return { ok: true as const, count };
}

export async function listPublishedBlogs(): Promise<PublicBlog[]> {
  try {
    await connectMongo();
    const docs = await BlogPost.find({ status: "published" }).sort({ publishedAt: -1, updatedAt: -1 }).lean();
    const published = docs.map((doc) => toPublicBlog(toAdminBlog(doc)));
    if (published.length === 0) return staticAsPublic();
    const slugs = new Set(published.map((post) => post.slug));
    return [...published, ...staticAsPublic().filter((post) => !slugs.has(post.slug))];
  } catch {
    return staticAsPublic();
  }
}

export async function getPublishedBlogBySlug(slug: string): Promise<PublicBlog | null> {
  try {
    await connectMongo();
    const doc = await BlogPost.findOne({ slug, locale: BLOG_LOCALE, status: "published" }).lean();
    if (doc) return toPublicBlog(toAdminBlog(doc));
    return staticAsPublic().find((post) => post.slug === slug) ?? null;
  } catch {
    return staticAsPublic().find((post) => post.slug === slug) ?? null;
  }
}
