/** Target max upload size after optional browser compress (50MB). */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_INPUT_BYTES = 200 * 1024 * 1024;

function pickRecorderMime() {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

/**
 * If the file is over the upload limit, re-encode in the browser at ~720p / lower bitrate.
 * Falls back to the original file when MediaRecorder is unavailable.
 */
export async function prepareVideoForUpload(file: File): Promise<{ file: File; compressed: boolean; note?: string }> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Only video files are allowed.");
  }
  if (file.size > MAX_VIDEO_INPUT_BYTES) {
    throw new Error("Video is too large to process (max 200MB before compress). Export a shorter/lower-quality clip.");
  }
  if (file.size <= MAX_VIDEO_BYTES) {
    return { file, compressed: false };
  }

  if (typeof document === "undefined" || typeof MediaRecorder === "undefined") {
    throw new Error(`Video must be ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB or smaller.`);
  }

  const mimeType = pickRecorderMime();
  if (!mimeType) {
    throw new Error(
      `Video is over ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB and this browser cannot compress it. Export as 720p MP4 under that size.`
    );
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read video for compression."));
    });

    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
    const width = Math.max(2, Math.round((video.videoWidth || maxWidth) * scale / 2) * 2);
    const height = Math.max(2, Math.round((video.videoHeight || 720) * scale / 2) * 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not compress video in this browser.");

    const stream = canvas.captureStream(24);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 1_800_000
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(";")[0] }));
      recorder.onerror = () => reject(new Error("Video compression failed."));
    });

    recorder.start(250);
    await video.play();

    const draw = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, width, height);
      requestAnimationFrame(draw);
    };
    draw();

    await new Promise<void>((resolve) => {
      video.onended = () => resolve();
    });
    recorder.stop();
    stream.getTracks().forEach((track) => track.stop());

    const blob = await done;
    if (blob.size > MAX_VIDEO_BYTES) {
      throw new Error(
        `Compressed video is still over ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))}MB. Use a shorter clip or lower quality export.`
      );
    }

    const extension = mimeType.includes("webm") ? "webm" : "mp4";
    const nextName = file.name.replace(/\.[^.]+$/, "") + `-compressed.${extension}`;
    const nextFile = new File([blob], nextName, { type: blob.type || "video/webm" });
    return {
      file: nextFile,
      compressed: true,
      note: `Compressed from ${(file.size / (1024 * 1024)).toFixed(1)}MB to ${(nextFile.size / (1024 * 1024)).toFixed(1)}MB.`
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
