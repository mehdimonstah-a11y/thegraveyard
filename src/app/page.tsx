import type { Metadata } from "next";
import WaitlistPage from "@/components/WaitlistPage";
import FullHome from "@/components/home/FullHome";

/**
 * The front door.
 *
 * Pre-launch this is the waitlist and nothing else. `src/middleware.ts` bounces
 * every other route here, because removing the links alone would not have done
 * it — a route with no link is still a route anyone can type.
 *
 * PUBLIC_SITE_OPEN=1 restores the full homepage and opens the gate with it. The
 * homepage moved to components/home/FullHome.tsx completely intact; nothing
 * about it was rewritten for the gate.
 */
const OPEN = process.env.PUBLIC_SITE_OPEN === "1";

const description =
  "Dead pools on this chain still hold money. We read every pool ever made and measured what is left. Join the waitlist.";

export const metadata: Metadata = OPEN
  ? {}
  : {
      title: "The Graveyard — the waitlist is open",
      description,
      openGraph: { title: "The Graveyard — the waitlist is open", description },
      twitter: { title: "The Graveyard — the waitlist is open", description },
    };

export default function Page() {
  if (OPEN) return <FullHome />;
  return <WaitlistPage />;
}
