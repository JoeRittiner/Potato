import { ChatInputCommandInteraction, InteractionReplyOptions, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Bot } from "../../Bot";

export default {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Manage chat functionality')
        .addSubcommand(subcommad => 
            subcommad
                .setName('listen')
                .setDescription('Enable chat listening mode'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('disable')
                .setDescription('Disable chat listening mode')),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();
        const client = interaction.client as Bot;
        console.log(`/chat ${subcommand} command executed`);

        switch (subcommand){
            case 'listen':
                if (client.listening) {
                    await interaction.reply({content: "Chat listening mode is already enabled.", flags: MessageFlags.Ephemeral});
                    return;
                }

                client.listening = true; // Try to enable listening mode
                if (!client.listening) { // Unable to enable listening mode
                    await interaction.reply({content: "Cannot enable listening mode: RMQ is not connected.", flags: MessageFlags.Ephemeral});
                } else { // listening mode enabled
                    await interaction.reply(`Chat listening mode enabled: ${client.listening}`);
                }
                return;
            case 'disable':
                client.listening = false;
                await interaction.reply("Chat listening mode disabled.");
                return;
            default:
                // Ignore unknown subcommands. Potentially let other Bot modules handle them.
                console.debug(`Unknown subcommand '$/chat ${subcommand}'. Ignoring.`);
                return;
        }
    }
}