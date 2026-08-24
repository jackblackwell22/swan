import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const options = await sessionCookieOptions();
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin/login" },
  });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: "/",
    maxAge: 0,
  });
  return response;
}
