import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Two-factor is switched off. Sign in with email and password." },
    { status: 400 },
  );
}
