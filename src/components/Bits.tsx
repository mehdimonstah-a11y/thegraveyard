"use client";

import { useState } from "react";

/**
 * SPEC.md §6.6 — the accordion. Rows separated by 1px dividers, question in the
 * display sans, a plus/minus affordance on the right, content-driven height,
 * no radius, expands in place.
 */
export function Accordion({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  // The reference ships its accordion fully collapsed on load — every question
  // visible, no answer. Matched.
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="border-t border-line">
      {items.map((item, i) => (
        <div key={item.q} className="border-b border-line">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="t150 flex w-full items-start justify-between gap-6 py-5 text-left text-ink hover:text-accent"
          >
            <span className="text-[16px] leading-6 font-medium md:text-[18px]">{item.q}</span>
            <span className="tnum mt-0.5 shrink-0 text-[18px] leading-6 text-ink-3" aria-hidden="true">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i ? (
            <div className="max-w-[68ch] pb-6 text-[15px] leading-6 text-ink-2">{item.a}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * The waitlist. One field.
 *
 * Nothing is stored unless a sink is configured; when it is not, the API route
 * says so in its response and this form prints that rather than pretending it
 * saved something it discarded.
 */
export function WaitlistForm({ tone = "dark" }: { tone?: "dark" | "on-accent" }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const onAccent = tone === "on-accent";
  const field = onAccent
    ? "h-12 w-full border border-on-accent bg-transparent px-4 text-[14px] text-on-accent placeholder:text-on-accent/75"
    : "h-12 w-full border border-line-strong bg-transparent px-4 text-[14px] text-ink placeholder:text-ink-3";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") ?? "") }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      setMessage(json.message ?? "");
      setState(res.ok && json.ok ? "done" : "error");
    } catch {
      setMessage("The request did not reach us. Nothing was recorded.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p
        className={`tnum border px-4 py-3 text-[13px] leading-5 uppercase tracking-[0.06em] ${
          onAccent ? "border-on-accent text-on-accent" : "border-accent text-accent"
        }`}
      >
        received · {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-[520px]">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            className={field}
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={state === "sending"}
          className={`t150 tnum h-12 px-6 text-[14px] font-medium uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-50 ${
            onAccent
              ? "border border-on-accent bg-on-accent text-accent hover:bg-transparent hover:text-on-accent"
              : "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-pressed"
          }`}
        >
          {state === "sending" ? "Sending" : "Join"}
        </button>
      </div>
      <p
        className={`mt-3 text-[13px] leading-5 ${onAccent ? "text-on-accent/80" : "text-ink-2"}`}
      >
        One address, nothing else. No wallet connection, no signature, and nothing to approve.{" "}
        {state === "error" ? message : null}
      </p>
    </form>
  );
}
