import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";

// Cache member ID for 2 minutes
export const revalidate = 120;

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeProfileId = await getActiveProfileWithParentMapping(session);

  const response = NextResponse.json({ memberId: activeProfileId });
  response.headers.set('Cache-Control', 's-maxage=120, stale-while-revalidate=240');
  return response;
}
