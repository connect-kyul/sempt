"use client";

import { useEffect, useState } from "react";
import { getDiscordSdk } from "@/lib/discord-sdk";
import { Badge } from "@/components/ui/badge";

export function EmbeddedClientStatus() {
  const [status, setStatus] = useState("초기화 대기");

  useEffect(() => {
    let active = true;
    getDiscordSdk()
      .then((sdk) => {
        if (!active) return;
        setStatus(sdk ? "Discord SDK ready" : "NEXT_PUBLIC_DISCORD_CLIENT_ID 필요");
      })
      .catch(() => {
        if (active) setStatus("Discord SDK 초기화 실패");
      });
    return () => {
      active = false;
    };
  }, []);

  return <Badge>{status}</Badge>;
}
