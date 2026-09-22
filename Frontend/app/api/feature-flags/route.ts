import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ tiltCards: process.env.TILT_CARDS_ENABLED !== "false" },
    { headers: { "Cache-Control": "no-store" } });
}
