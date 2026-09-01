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
 * One field, because one field is all this needs: an address to write to when
 * there is something to say. No wallet, no signature, nothing to approve.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = (await req.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ ok: false, message: "Unreadable request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";

  if (!EMAIL.test(email)) {
    return NextResponse.json({ ok: false, message: "That address does not look like an address." }, { status: 400 });
  }

  const sink = process.env.WAITLIST_WEBHOOK_URL;

  if (!sink) {
    return NextResponse.json({
      ok: true,
      message:
        "no sink is configured, so nothing was stored. Come back when there is something to join.",
    });
  }

  try {
    const res = await fetch(sink, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, at: new Date().toISOString() }),
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
    message: "recorded. Nothing is deployed yet, and you will hear from us when it is.",
  });
}
