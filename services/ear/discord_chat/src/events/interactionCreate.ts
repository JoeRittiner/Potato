import { DiscordAPIError, Events, Interaction, InteractionReplyOptions, MessageFlags, MessageReplyOptions } from "discord.js";
import { Bot } from "../Bot.js";

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const client = interaction.client;
        if (!(client instanceof Bot)) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command mathching '${interaction.commandName}'.`)
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code === 10062) {
                console.warn('Interaction has already been acknowledged.');
                interaction.replied ||= true;
                interaction.followUp({content: `⚠️ This Message was attempted to be processed multiple times.`, flags: MessageFlags.Ephemeral })
                return;
            }

            console.error(error);
            try {
                const msg: InteractionReplyOptions = { content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral};
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(msg)
                } else {
                    await interaction.reply(msg);
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
}