import { Events, Interaction, InteractionReplyOptions, MessageFlags, MessageReplyOptions } from "discord.js";
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
            console.error(error);
            const msg: InteractionReplyOptions = { content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral};
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(msg)
            } else {
                await interaction.reply(msg);
            }
        }
    }
}