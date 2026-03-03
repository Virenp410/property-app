import { NextResponse } from "next/server";

const isHttpsRequest = (request) =>
  String(request?.nextUrl?.protocol || "").toLowerCase() === "https:";

const clearAuthCookies = (response, request) => {
  const secure = isHttpsRequest(request);
  const names = [
    "csrf_token",
    "csrf_token_auto",
    "refresh_token",
    "refresh_token_auto",
    "access_token",
    "access_token_auto",
  ];

  for (const name of names) {
    response.cookies.set({
      name,
      value: "",
      expires: new Date(0),
      httpOnly: name === "refresh_token" || name === "refresh_token_auto",
      secure,
      sameSite: "lax",
      path: "/",
    });
  }
};

const handleLogout = async (request) => {
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response, request);
  return response;
};

export async function POST(request) {
  return handleLogout(request);
}

export async function DELETE(request) {
  return handleLogout(request);
}

