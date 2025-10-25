import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'node:url';
import fs from 'fs';
import path from 'path';
import { Command } from "./types/Command";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) throw new Error('DISCORD_TOKEN environment variable is not set.');
if (!clientId) throw new Error('DISCORD_CLIENT_ID environment variable is not set.');
if (!guildId) throw new Error('DISCORD_GUILD_ID environment variable is not set.');

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const { default: command }: {default: Command} = await import(path.join(commandsPath, file));

		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.warn(`The command at ${file} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {

		// Fetch existing commands
		const existing = await rest.get(Routes.applicationGuildCommands(clientId, guildId));

		if (!Array.isArray(existing)) {
			throw new Error('Unexpected response when fetching existing commands');
		}

		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		for (const cmd of commands) {
			const match = existing.find((c) => c.name === cmd.name);
			if (match) {
				// Update existing command
				await rest.patch(
				Routes.applicationGuildCommand(clientId, guildId, match.id),
				{ body: cmd }
				);
				console.log(`Updated command ${cmd.name}`);
			} else {
				// Create new command
				await rest.post(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: cmd }
				);
				console.log(`Created command ${cmd.name}`);
			}
		}
	} catch (error) {
		console.error(error);
	}
})();