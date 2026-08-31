import { NextResponse } from "next/server";
import { scan } from "@/lib/data";

/**
 * The dataset, downloadable. The brief calls the scan the moat; a moat you
 * cannot download is a screenshot.
 */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(scan, {
    headers: {
      "content-disposition": `attachment; filename="thegraveyard-scan-block-${scan.meta.headBlock}.json"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
