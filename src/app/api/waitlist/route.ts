import { NextResponse } from "next/server";

/**
 * The waitlist sink.
 *
 * If `WAITLIST_WEBHOOK_URL` is set, the submission is forwarded there and the
 * response says it was stored. If it is not set, nothing is stored and the
 * response says THAT, in the same words the interface prints. A form that
 * pretends to have saved something it discarded is the exact kind of small lie
 * this whole project is arguing against.
 *
 * The country field exists because §10.4 of the build brief requires it. It is
 * recorded and not validated against a list here: a claimed country is what a
 * form can collect, and treating it as verification would be theatre.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESTRICTED = ["united states", "usa", "us", "canada", "united kingdom", "uk", "britain"];

export async function POST(req: Request) {
  let body: { email?: unknown; country?: unknown };
  try {
    body = (await req.json()) as { email?: unknown; country?: unknown };
  } catch {
    return NextResponse.json({ ok: false, message: "Unreadable request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  const country = typeof body.country === "string" ? body.country.trim().slice(0, 80) : "";

  if (!EMAIL.test(email)) {
    return NextResponse.json({ ok: false, message: "That address does not look like an address." }, { status: 400 });
  }
  if (country.length < 2) {
    return NextResponse.json({ ok: false, message: "A country is required. There is no workaround." }, { status: 400 });
  }

  const restricted = RESTRICTED.includes(country.toLowerCase());
  const sink = process.env.WAITLIST_WEBHOOK_URL;

  if (!sink) {
    return NextResponse.json({
      ok: true,
      message:
        "no sink is configured, so nothing was stored. Come back when there is something to join.",
      restricted,
    });
  }

  try {
    const res = await fetch(sink, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, country, restricted, at: new Date().toISOString() }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    return NextResponse.json(
      { ok: false, message: "The sink did not accept it. Nothing was stored." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: restricted
      ? "recorded, and flagged: Stock Token graves are not available where you are."
      : "recorded. Nothing is deployed yet, and you will hear from us when it is.",
    restricted,
  });
}
