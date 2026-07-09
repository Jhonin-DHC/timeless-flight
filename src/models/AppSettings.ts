import mongoose, { Schema, models } from "mongoose";

const AppSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const AppSettings = models.AppSettings || mongoose.model("AppSettings", AppSettingsSchema);

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await AppSettings.findOne({ key });
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await AppSettings.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
}
