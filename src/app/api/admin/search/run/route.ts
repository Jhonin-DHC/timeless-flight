import { NextResponse } from "next/server";
import { runAllEnabledSearches, runSingleSearch } from "@/lib/search-runner";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { queryId?: string };
    const summary = body.queryId ? [await runSingleSearch(body.queryId)] : await runAllEnabledSearches();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search run failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
