import Landing from "@/components/Landing";

/**
 * The front door.
 *
 * The site is open. There was a middleware gate here that bounced every route
 * back to a waitlist; it is gone, along with the waitlist itself, because there
 * is now something behind the door worth opening.
 */
export default function Page() {
  return <Landing />;
}
