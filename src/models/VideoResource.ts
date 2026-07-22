import mongoose, { Schema, models } from "mongoose";

const VideoResourceSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    videoUrl: { type: String, required: true },
    videoKey: { type: String, default: "" },
    contentType: { type: String, default: "video/mp4" },
    sizeBytes: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const VideoResource = models.VideoResource || mongoose.model("VideoResource", VideoResourceSchema);
