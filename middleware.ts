import { NextRequest, NextResponse } from "next/server";

const locales = ["ka", "en"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  const accept = (req.headers.get("accept-language") ?? "").toLowerCase();
  const locale = accept.startsWith("en") ? "en" : "ka";

  // Behind nginx, nextUrl's host is the internal 127.0.0.1:3000, so take the public
  // host and scheme from the headers nginx forwards.
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const host = req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    return NextResponse.redirect(`${proto}://${host}${url.pathname}${url.search}`);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
