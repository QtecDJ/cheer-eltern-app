import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveProfileWithParentMapping } from "@/lib/get-active-profile-server";

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeProfileId = await getActiveProfileWithParentMapping(session);

  return NextResponse.json({ memberId: activeProfileId });
}
