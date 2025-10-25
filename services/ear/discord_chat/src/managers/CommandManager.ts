import { Client, Collection } from "discord.js";
import { fileURLToPath } from 'node:url';
import path from "path";
import fs from "fs";
import { Command } from "../types/Command";
import { Bot } from "../Bot";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(bot: Bot, pathname: string) {
    const foldersPath = path.join(__dirname, pathname);
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {

        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));  

        for (const file of commandFiles) {
            const { default: command }: {default: Command} = await import(path.join(commandsPath, file));
            try{
                if ('data' in command && 'execute' in command) {
                    console.log(`'${command.data.name}' loaded.'`);
                    bot.commands.set(command.data.name, command);
                } else {
                    console.warn(`The command at ${file} is missing a required "data" or "execute" property.`);
                }
            } catch (TypeError) {
                console.error(`The command at ${file} could not be loaded due to a type error. Please check the command structure.`);
            }
        }
    }
} 