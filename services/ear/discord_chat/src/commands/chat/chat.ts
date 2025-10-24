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

        const tmp_msg: InteractionReplyOptions = {content: "Not Implemented", flags: MessageFlags.Ephemeral}; // TODO: Remove 

        switch (subcommad){
            case 'listen':
                await interaction.reply(tmp_msg);
                console.log("'/chat listen' command not implemented")
                return;
            case 'disable':
                await interaction.reply(tmp_msg);
                console.log("'/chat listen' command not implemented")
                return;
            default:
                console.log("Unknown subcommand");
                return;
        }
    }
}