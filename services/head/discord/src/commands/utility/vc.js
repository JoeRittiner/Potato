const { SlashCommandBuilder, MessageFlags, ChannelType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { startEar } = require('./vc/earTCPStream.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('vc')
		.setDescription('Manage voice chat functionality')
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('join')
		        .setDescription('Connect Bot to a Voice Channel')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('voice channel')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(true)
                )
		    )
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('leave')
		        .setDescription('Disconnect Bot from a Voice Channel'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('listen')
		        .setDescription('Enable voice chat listening mode'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('deafen')
		        .setDescription('Deafen the bot'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('status')
		        .setDescription('Check voice chat status')),

	async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        console.log(`/vc ${subcommand} command executed`);

        switch (subcommand) {
        case 'join':
            const channel = interaction.options.getChannel('channel');

            await interaction.reply({ content: `🔌 Connecting to ${channel.name}...`, flags: MessageFlags.Ephemeral });
            await connectToVC(interaction, channel);
            break;
        case 'leave':
            await interaction.reply({ content: `🔌 Disconnecting...`, flags: MessageFlags.Ephemeral });
            await disconnectFromVC(interaction);
            break;
        case 'listen':
            await interaction.deferReply();
            try {
                await startEar(interaction);
                await interaction.editReply(`👂 Listening to voice activity in ${interaction.client.voiceChannel.name}`);
            } catch (error) {
                console.error('Failed to start listening:', error);
                await interaction.editReply('Failed to start listening');
            }
            break;
        case 'deafen':

            console.warn("Not implemented yet");

            return await interaction.reply('Not implemented yet!');

        case 'status':

            console.warn("Not implemented yet");

            return await interaction.reply('Not implemented yet!');

        default:
            console.warn(`Unknown subcommand ${subcommand}`);
            return await interaction.reply({ content: ':interrobang: Unknown subcommand. Please use a valid subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};

async function connectToVC(interaction, voiceChannel) {
    const client = interaction.client;
    if (client.voiceConnection){
        console.log(`Already connected to ${client.voiceChannel.name}`);
        interaction.editReply(`ℹ️ Already connected to ${client.voiceChannel.name}`);
        return;
    } else {
        try {
            client.voiceConnection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                    selfDeaf: true,
                    selfMute: true,
                });
            client.voiceChannel = voiceChannel;

            console.log(`Connected to ${voiceChannel.name} in ${interaction.guild.name}`);
            await interaction.editReply(`✅ Connected to ${voiceChannel.name}`);
        } catch (error) {
            console.error('Failed to connect to voice channel:', error);
            await interaction.editReply('❗ Failed to connect to the voice channel.');
        }
    }
}

async function disconnectFromVC(interaction) {
    const client = interaction.client;

    if (client.voiceConnection){
        try {
            client.voiceConnection.destroy();

            console.log(`Disconnected from ${client.voiceChannel.name} in ${interaction.guild.name}`);
            await interaction.editReply(`☑️ Disconnected from ${client.voiceChannel.name}`);

            client.voiceChannel = null;
            client.voiceConnection = null;
        } catch (error) {
            console.error('Failed to disconnect from voice channel:', error);
            await interaction.editReply('❗ Failed to disconnect from the voice channel.');
        }
    }
}