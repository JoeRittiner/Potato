import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, AnyComponentBuilder } from "discord.js";
import { Bot } from "../../Bot";

export default {
    data: new SlashCommandBuilder()
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setName('rmq')
        .setDescription('RMQ management commands')
        .addSubcommand(subcommad => 
            subcommad
                .setName('connect')
                .setDescription('(Re)connect to RabbitMQ server'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('status')
                .setDescription('Get RMQ connection status'))
        .addSubcommand(subcommand => 
            subcommand
                .setName('disconnect')
                .setDescription('Manually disconnect from RabbitMQ server')),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommad = interaction.options.getSubcommand();
        const client = interaction.client as Bot;
        console.log(`/chat ${subcommad} command executed`);

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        switch (subcommad){
            case 'connect':
                try {
                    await client.rmqManager.connect();
                    await interaction.editReply("Connected to RMQ");
                } catch (error) {
                    console.error('Error connecting to RMQ:', error);
                    await interaction.editReply("Failed to connect to RMQ");
                }
                return;
            case 'disconnect':
                try {
                    await client.rmqManager.disconnect();
                    await interaction.editReply("Disconnected from RMQ");
                } catch (error) {
                    console.error('Error disconnecting from RMQ:', error);
                    await interaction.editReply("Failed to disconnect from RMQ");
                }
                return;
            case 'status':
                await interaction.editReply(format_status(client.rmqManager.getStatus()));
                return;
            default:
                console.log("Unknown subcommand");
                return;
        }
    }
}

function format_status(status: {
    connected: boolean;
    channelCreated: boolean;
}): string {
    return `Connected: ${status.connected}\nChannel Created: ${status.channelCreated}`;
}