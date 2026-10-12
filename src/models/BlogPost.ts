import mongoose, { Schema, models } from "mongoose";
import { BLOG_CATEGORIES, BLOG_STATUSES } from "@/lib/blog-types";

const BlogImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    caption: { type: String, default: "" }
  },
  { _id: false }
);

const BlogPostSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true },
    locale: { type: String, enum: ["en", "es"], default: "en", required: true },
    translationOf: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: "" },
    category: { type: String, enum: BLOG_CATEGORIES, default: "buying-guides", required: true },
    body: { type: String, default: "" },
    status: { type: String, enum: BLOG_STATUSES, default: "draft", required: true },
    publishedAt: { type: Date, default: null },
    readingMinutes: { type: Number, default: 1 },
    updatedByEmail: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    coverAlt: { type: String, default: "" },
    images: { type: [BlogImageSchema], default: [] },
    previousSlugs: { type: [String], default: [] }
  },
  { timestamps: true }
);

BlogPostSchema.index({ slug: 1, locale: 1 }, { unique: true });
BlogPostSchema.index({ previousSlugs: 1 });
BlogPostSchema.index({ status: 1, publishedAt: -1 });

export const BlogPost = models.BlogPost || mongoose.model("BlogPost", BlogPostSchema);
