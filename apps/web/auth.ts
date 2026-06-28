import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import Discord from "next-auth/providers/discord";

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID ?? "missing-client-id",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "missing-client-secret",
      authorization: {
        params: {
          scope: "identify guilds"
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account?.access_token) {
        token.discordAccessToken = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        discordAccessToken: token.discordAccessToken
      } satisfies Session;
    }
  }
};

export function auth() {
  return getServerSession(authOptions);
}

export function hasManageGuildPermission(guild: DiscordGuild): boolean {
  const manageGuild = 0x20n;
  const administrator = 0x8n;
  const permissions = BigInt(guild.permissions);
  return guild.owner || (permissions & administrator) === administrator || (permissions & manageGuild) === manageGuild;
}

export async function fetchDiscordGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Discord guild fetch failed: ${response.status}`);
  }

  return (await response.json()) as DiscordGuild[];
}

export async function getManageableGuilds(): Promise<DiscordGuild[]> {
  const session = await auth();
  const accessToken = session?.discordAccessToken;
  if (!accessToken) return [];
  const guilds = await fetchDiscordGuilds(accessToken);
  return guilds.filter(hasManageGuildPermission);
}

export async function canManageGuild(guildId: string): Promise<boolean> {
  const guilds = await getManageableGuilds();
  return guilds.some((guild) => guild.id === guildId);
}
