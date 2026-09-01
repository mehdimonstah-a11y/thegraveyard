import { NextResponse, type NextRequest } from "next/server";

/**
 * Pre-launch: the waitlist is the only public surface.
 *
 * The full site — the scan, the dataset, the docs and the archive — still
 * exists and still builds. It is simply not reachable from outside until this
 * flag flips. Removing the links alone would not have done it: a route with no
 * link is still a route anyone can type, and `/scan/data.json` in particular
 * would have handed over the entire dataset to anyone who guessed the path.
 *
 * `/api/waitlist` is deliberately NOT gated. Without it the front door cannot
 * accept anyone, which would make the one open page useless.
 *
 * To open the site, set PUBLIC_SITE_OPEN=1 in the environment. No code change,
 * and no redeploy of anything but the variable.
 */
const OPEN = process.env.PUBLIC_SITE_OPEN === "1";

const GATED = [/^\/scan(\/|$)/, /^\/docs(\/|$)/, /^\/exhumations(\/|$)/, /^\/g(\/|$)/];

export function middleware(req: NextRequest) {
  if (OPEN) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (!GATED.some((re) => re.test(pathname))) return NextResponse.next();

  const to = req.nextUrl.clone();
  to.pathname = "/";
  to.search = "";
  // Temporary on purpose: this reopens at launch, and a 308 would sit in
  // browser caches long after the flag flips.
  return NextResponse.redirect(to, 307);
}

export const config = {
  matcher: ["/scan/:path*", "/docs/:path*", "/exhumations/:path*", "/g/:path*"],
};
