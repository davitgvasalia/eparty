import { NextRequest, NextResponse } from "next/server";

const locales = ["ka", "en"];

/**
 * Whether the request comes from one of the apps rather than a browser:
 * - the Android app (Trusted Web Activity) opens its start page with the referrer
 *   android-app://<package>/,
 * - the iOS app adds "EPartyApp" to its user agent (ios/capacitor.config.json),
 * - an installed PWA and newer app builds open "/?source=app".
 */
function fromApp(req: NextRequest): boolean {
  if (req.nextUrl.searchParams.get("source") === "app") return true;
  if ((req.headers.get("referer") ?? "").startsWith("android-app://")) return true;
  return /\bEPartyApp\b/.test(req.headers.get("user-agent") ?? "");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Files such as /icons/icon.svg, /sw.js or /manifest.webmanifest are served as they are.
  if (/\.[^/]+$/.test(pathname)) return NextResponse.next();

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  const accept = (req.headers.get("accept-language") ?? "").toLowerCase();
  const locale = accept.startsWith("en") ? "en" : "ka";

  // The bare domain opens the public website in a browser and the app itself in the apps.
  // The website's "Open the app" button links to /<locale>, the app's "Website" to /<locale>/site.
  const target = pathname === "/" ? (fromApp(req) ? "" : "/site") : pathname;

  // Behind nginx, nextUrl's host is the internal 127.0.0.1:3000, so take the public
  // host and scheme from the headers nginx forwards.
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${target}`;
  url.searchParams.delete("source");
  const host = req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    return NextResponse.redirect(`${proto}://${host}${url.pathname}${url.search}`);
  }
  return NextResponse.redirect(url);
}

export const config = {
  // Files (icons, sw.js, manifest) are skipped in the function: an escaped dot in this
  // pattern loses its backslash and excluded every path longer than one character.
  matcher: ["/((?!_next|api).*)"],
};
