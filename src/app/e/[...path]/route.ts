import { NextResponse } from "next/server";
import { EXPLORER_ORIGIN } from "@/lib/chain";

/**
 * Explorer links, routed through our own path.
 *
 * Every figure on this site has to be checkable, so the addresses, blocks and
 * transactions all link out. But the explorer's vendor name and the chain's
 * name are boilerplate, and putting them in a few hundred `href` attributes
 * puts them on the page whether or not anyone renders them as text.
 *
 * So links point at `/e/address/0x…` and land here. One redirect, one file to
 * change if the explorer ever moves, and nothing in the markup but our own
 * domain.
 *
 * The allow-list is the point: without it this is an open redirect, and an open
 * redirect on a site whose entire pitch is "check our numbers" would be a
 * genuinely bad joke.
 */

const KINDS = new Set(["address", "token", "block", "tx"]);
const SAFE = /^[A-Za-z0-9]+$/;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const [kind, value, ...rest] = path ?? [];

  if (rest.length || !kind || !value || !KINDS.has(kind) || !SAFE.test(value.replace(/^0x/, ""))) {
    return NextResponse.redirect(new URL("/scan", req.url), 307);
  }
  return NextResponse.redirect(`${EXPLORER_ORIGIN}/${kind}/${value}`, 307);
}
