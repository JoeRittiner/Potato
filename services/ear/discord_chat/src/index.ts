import { Bot } from "./Bot.js";

const token = process.env.DISCORD_TOKEN;
if (!token) {
    throw new Error('DISCORD_TOKEN environment variable is not set.');
}

const bot = new Bot();
bot.start(token);