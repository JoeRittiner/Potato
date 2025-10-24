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
        const subcommad = interaction.options.getSubcommand();
        const client = interaction.client as Bot;
        console.log(`/chat ${subcommad} command executed`);

        switch (subcommad){
            case 'listen':
                client.listening = true;
                if (!client.listening) {
                    await interaction.reply({content: "Cannot enable listening mode: Bot is not ready or RMQ is not connected.", flags: MessageFlags.Ephemeral});
                    return;
                }
                await interaction.reply("Chat listening mode enabled.");
                return;
            case 'disable':
                client.listening = false;
                await interaction.reply("Chat listening mode disabled.");
                return;
            default:
                console.log("Unknown subcommand");
                return;
        }
    }
}