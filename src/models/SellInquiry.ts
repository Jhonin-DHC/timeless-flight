import mongoose, { Schema, models } from "mongoose";

const SellInquirySchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    verifiedAt: { type: Date },
    description: { type: String, default: "" },
    photoUrls: { type: [String], default: [] },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    phone: { type: String, default: "" },
    phoneCountryCode: { type: String, default: "+1" },
    country: { type: String, default: "United States" },
    zipCode: { type: String, default: "" },
    appointmentAt: { type: Date },
    appointmentLabel: { type: String, default: "" },
    location: { type: String, default: "Timeless Flight — Virtual / By appointment" },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft"
    },
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
