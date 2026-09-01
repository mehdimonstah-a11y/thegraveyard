/**
 * The mark.
 *
 * Three bars and a wall. Each bar is a grave: filled to what can actually be
 * pulled out of it. The wall is the reserve, and it is the one line in the
 * whole identity — it runs taller than the stack so it reads as a boundary
 * rather than a fourth bar, and nothing ever touches it.
 *
 * The bars shorten downward and the gap to the wall widens with each one, so
 * the shape is a wedge opening to the right. That is the actual behaviour of
 * the maths this product is built on: every additional unit of supply recovers
 * less than the one before it, and the remainder never closes.
 *
 * Drawn, not imported. There is no image file in this project — the same
 * geometry is what gets rendered at 1024px for the avatar and at 1500px for
 * the banner, so the mark is identical at every size it appears.
 */

export const MARK_GEOMETRY = {
  viewBox: 64,
  /** The reserve. Taller than the stack, and never reached. */
  wall: { x: 49.5, y: 5, w: 3.5, h: 54 },
  /** What comes out. Shorter each time; the gap to the wall widens. */
  bars: [
    { x: 7, y: 11, w: 39, h: 10 },
    { x: 7, y: 27, w: 28, h: 10 },
    { x: 7, y: 43, w: 17, h: 10 },
  ],
};

export function Mark({
  size = 20,
  className = "",
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  const { viewBox, wall, bars } = MARK_GEOMETRY;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {bars.map((b) => (
        <rect key={b.y} x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--color-accent)" />
      ))}
      <rect x={wall.x} y={wall.y} width={wall.w} height={wall.h} fill="currentColor" />
    </svg>
  );
}

/**
 * The mark plus the name, locked up. Used in the header and on the front door;
 * exported at 1200px wide for anywhere a wordmark file is wanted.
 */
export function Wordmark({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={size} />
      <span
        className="font-semibold tracking-[-0.02em]"
        style={{ fontSize: size * 0.78, lineHeight: 1 }}
      >
        The Graveyard
      </span>
    </span>
  );
}
