import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";

// No cache: personalized auth endpoint - must always return the current user
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeProfileId = await getActiveProfileWithParentMapping(session);

  const response = NextResponse.json({ memberId: activeProfileId });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
