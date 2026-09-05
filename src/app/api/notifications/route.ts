import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ notifications: [] });
}

export async function PATCH() {
  return NextResponse.json({ ok: true });
}
