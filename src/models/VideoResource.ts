import mongoose, { Schema, models } from "mongoose";

const VideoResourceSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    /** R2 (or other) direct file URL. Optional when youtubeVideoId is set. */
    videoUrl: { type: String, default: "" },
    videoKey: { type: String, default: "" },
    contentType: { type: String, default: "video/mp4" },
    sizeBytes: { type: Number, default: 0 },
    /** Optional YouTube video id for embed playback. */
    youtubeVideoId: { type: String, default: "" },
    published: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const VideoResource = models.VideoResource || mongoose.model("VideoResource", VideoResourceSchema);
