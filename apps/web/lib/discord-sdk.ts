export interface DiscordEmbeddedSdkLike {
  ready(): Promise<void>;
}

export async function getDiscordSdk(): Promise<DiscordEmbeddedSdkLike | null> {
  if (typeof window === "undefined") return null;
  return null;
}

export function isEmbeddedApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/embedded");
}
