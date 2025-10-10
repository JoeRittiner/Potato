import { Client } from "discord.js";
import { fileURLToPath } from 'node:url';
import path from "path";
import fs from "fs";
import { DiscordEvent } from "../types/Event";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerEvents(client: Client, pathname: string) {
    const eventsPath = path.join(__dirname, pathname);
    const eventFiles = fs.readdirSync(eventsPath).filter((file: string) => file.endsWith('.js'));

    for (const file of eventFiles) {
        const { default: event }: { default: DiscordEvent} = await import(path.join(eventsPath, file));
        try {
            if ('name' in event && 'execute' in event) {
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args));
                } else {
                    client.on(event.name, (...args) => event.execute(...args));
                }
            } else {
                console.warn(`The event at ${file} is missing a required "name" or "execute" property.`);
            }
        } catch (TypeError) {
            console.error(`The event at ${file} could not be loaded due to a type error. Please check the command structure.`);
        }
    }
}