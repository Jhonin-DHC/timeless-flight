import mongoose, { Schema, models } from "mongoose";

const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const AdminUser = models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);
