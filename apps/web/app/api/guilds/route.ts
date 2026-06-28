import { NextResponse } from "next/server";
import { getManageableGuilds } from "@/auth";

export async function GET() {
  const guilds = await getManageableGuilds();
  return NextResponse.json({ guilds });
}
