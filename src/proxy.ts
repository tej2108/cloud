// Password-protects the whole site with HTTP Basic Auth, for sharing a preview
// with a few people. The credentials live in environment variables
// (SITE_USERNAME, SITE_PASSWORD) set on the host, never in the code.

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const CHALLENGE = 'Basic realm="Trapphus preview", charset="UTF-8"';

/** Compares in constant time so response timing doesn't leak how much of a guess was right. */
function safeEqual(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function proxy(request: NextRequest) {
  const username = process.env.SITE_USERNAME;
  const password = process.env.SITE_PASSWORD;

  if (!username || !password) {
    // Open while developing locally; in production a missing login locks the site rather than exposing it.
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("This site is locked because no login is configured on the server.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const [scheme, encoded] = (request.headers.get("authorization") ?? "").split(" ");
  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    if (sep > 0) {
      // Check both parts every time, so a wrong username takes as long as a wrong password.
      const userOk = safeEqual(decoded.slice(0, sep), username);
      const passOk = safeEqual(decoded.slice(sep + 1), password);
      if (userOk && passOk) return NextResponse.next();
    }
  }

  return new NextResponse("Sign in to view this site.", {
    status: 401,
    headers: { "WWW-Authenticate": CHALLENGE, "Cache-Control": "no-store" },
  });
}

// Every path, including scripts, styles and fonts, so nothing loads without signing in.
export const config = {
  matcher: "/:path*",
};
