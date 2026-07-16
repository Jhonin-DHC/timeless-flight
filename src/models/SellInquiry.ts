import mongoose, { Schema, models } from "mongoose";

const SellReplySchema = new Schema(
  {
    body: { type: String, required: true },
    createdBy: { type: String, default: "admin" },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const SellInquirySchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    emailVerifiedAt: { type: Date },
    description: { type: String, default: "" },
    photoUrls: { type: [String], default: [] },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    phone: { type: String, default: "" },
    phoneCountryCode: { type: String, default: "+1" },
    country: { type: String, default: "United States" },
    zipCode: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "reviewed", "replied", "closed"],
      default: "new",
      index: true
    },
    isUnread: { type: Boolean, default: true, index: true },
    adminNotes: { type: String, default: "" },
    replies: { type: [SellReplySchema], default: [] },
    privacyAccepted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const SellInquiry = models.SellInquiry || mongoose.model("SellInquiry", SellInquirySchema);

const SellVerificationSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const SellVerification =
  models.SellVerification || mongoose.model("SellVerification", SellVerificationSchema);
