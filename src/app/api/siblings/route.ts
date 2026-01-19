import { NextRequest, NextResponse } from "next/server";
import { getSiblingsByLastName } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get("id");
  const lastName = searchParams.get("lastName");
  if (!id || !lastName) {
    return NextResponse.json({ error: "Missing id or lastName" }, { status: 400 });
  }
  const siblings = await getSiblingsByLastName(Number(id), lastName);
  return NextResponse.json(siblings);
}
