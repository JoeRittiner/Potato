import { REST, Routes } from 'discord.js';
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token)
    throw new Error('DISCORD_TOKEN environment variable is not set.');
if (!clientId)
    throw new Error('DISCORD_CLIENT_ID environment variable is not set.');
if (!guildId)
    throw new Error('DISCORD_GUILD_ID environment variable is not set.');
const rest = new REST().setToken(token);
(async () => {
    try {
        console.log('Clearing all guild commands...');
        const dataGuild = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] } // Empty array removes all commands
        );
        console.log(`Successfully cleared ${Array.isArray(dataGuild) ? dataGuild.length : 0} commands.`);
        console.log('Clearing all global commands...');
        const dataGlobal = await rest.put(Routes.applicationCommands(clientId), { body: [] } // Empty array removes all commands
        );
        console.log(`Successfully cleared ${Array.isArray(dataGlobal) ? dataGlobal.length : 0} commands.`);
    }
    catch (error) {
        console.error('Failed to clear commands:', error);
    }
})();
