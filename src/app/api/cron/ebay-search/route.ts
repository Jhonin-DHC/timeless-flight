import { NextResponse } from "next/server";
import { runAllEnabledSearches } from "@/lib/search-runner";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runAllEnabledSearches();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
