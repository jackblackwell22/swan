import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/admin/login", "http://127.0.0.1:43141"), 303);
}

export async function POST() {
  return NextResponse.redirect(new URL("/admin/login", "http://127.0.0.1:43141"), 303);
}
