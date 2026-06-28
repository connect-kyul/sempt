import { DiscordSDK } from "@discord/embedded-app-sdk";

let sdk: DiscordSDK | null | undefined;

export async function getDiscordSdk(): Promise<DiscordSDK | null> {
  if (typeof window === "undefined") return null;
  if (sdk !== undefined) return sdk;
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) {
    sdk = null;
    return sdk;
  }
  sdk = new DiscordSDK(clientId);
  await sdk.ready();
  return sdk;
}

export function isEmbeddedApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/embedded");
}
