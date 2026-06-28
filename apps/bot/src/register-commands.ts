import "dotenv/config";
import { REST, Routes } from "discord.js";
import { getConfig } from "@sempt/config";
import { semptCommand } from "./commands/sempt";

const config = getConfig();

if (!config.DISCORD_TOKEN || !config.DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID are required to register commands.");
}

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);
await rest.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), {
  body: [semptCommand.toJSON()]
});

console.log("Registered /sempt command.");
