import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAssignedMessageCount, getRepliedMessageCountForMember } from "@/lib/queries";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 });
  try {
    const count = await getAssignedMessageCount(session.id);
    const replied = await getRepliedMessageCountForMember(session.id);
    return NextResponse.json({ count, replied });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ count: 0, replied: 0 });
  }
}
