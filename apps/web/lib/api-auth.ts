import { auth, canManageGuild } from "@/auth";
import { forbidden, unauthorized } from "./response";

export async function requireGuildManager(guildId: string) {
  const session = await auth();
  if (!session?.discordAccessToken) {
    return { ok: false as const, response: unauthorized(), session: null };
  }
  if (!(await canManageGuild(guildId))) {
    return { ok: false as const, response: forbidden(), session };
  }
  return { ok: true as const, session };
}
