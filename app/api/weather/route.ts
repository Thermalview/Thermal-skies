import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    route: "weather",
    message: "Weather API stub is live",
    timestamp: new Date().toISOString(),
  });
}
