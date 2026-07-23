import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import {
  DEFAULT_YOUTUBE_CHANNEL_CONFIG,
  parseYoutubeChannelInput,
  type YoutubeChannelConfig
} from "@/lib/youtube";
import { getSetting, setSetting } from "@/models/AppSettings";

export async function GET() {
  try {
    await connectMongo();
    const stored = await getSetting<Partial<YoutubeChannelConfig>>(
      "youtubeChannel",
      DEFAULT_YOUTUBE_CHANNEL_CONFIG
    );
    return NextResponse.json({
      config: { ...DEFAULT_YOUTUBE_CHANNEL_CONFIG, ...stored }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load YouTube channel settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    const parsed = parseYoutubeChannelInput(
      typeof body.channelUrl === "string" && body.channelUrl.trim()
        ? body.channelUrl
        : typeof body.channelId === "string"
          ? body.channelId
          : ""
    );

    const channelId =
      typeof body.channelId === "string" && body.channelId.trim()
        ? body.channelId.trim()
        : parsed.channelId;

    const config: YoutubeChannelConfig = {
      enabled: Boolean(body.enabled),
      channelUrl:
        typeof body.channelUrl === "string" && body.channelUrl.trim()
          ? body.channelUrl.trim()
          : parsed.channelUrl,
      channelId,
      playlistId: typeof body.playlistId === "string" ? body.playlistId.trim() : "",
      sectionTitle:
        typeof body.sectionTitle === "string" && body.sectionTitle.trim()
          ? body.sectionTitle.trim()
          : DEFAULT_YOUTUBE_CHANNEL_CONFIG.sectionTitle
    };

    await setSetting("youtubeChannel", config);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save YouTube channel settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
