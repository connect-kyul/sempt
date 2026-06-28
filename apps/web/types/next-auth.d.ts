import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    discordAccessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordAccessToken?: string;
  }
}
