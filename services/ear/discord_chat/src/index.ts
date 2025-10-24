import { Bot } from "./Bot.js";

const token = process.env.DISCORD_TOKEN;
if (!token) {
    throw new Error('DISCORD_TOKEN environment variable is not set.');
}

const bot = new Bot();

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    try {
        await bot.stop();
        console.log('Bot shut down successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

bot.start(token);