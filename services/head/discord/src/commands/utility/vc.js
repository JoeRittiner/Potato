const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('vc')
		.setDescription('Manage voice chat functionality')
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('join')
		        .setDescription('Connect Bot to a Voice Channel')
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

        // Ensure the user is in a voice channel
        const channel = interaction.member.voice.channel;
        if (!channel) {
            console.log(`${interaction.user.tag} is not in a voice channel`)
            return interaction.reply({ content: '❗ You are not in a voice channel.', flags: MessageFlags.Ephemeral });
        }

        switch (subcommand) {
        case 'join':
            await interaction.reply({ content: `🔌 Connecting to ${channel.name}...`, flags: MessageFlags.Ephemeral });
            await handleConnect(interaction);
            break;
        case 'leave':
            await interaction.reply({ content: `🔌 Disconnecting from ${channel.name}...`, flags: MessageFlags.Ephemeral });
            await handleDisconnect(interaction);
            break;
        case 'listen':
            console.warn("Not implemented yet");

            return await interaction.reply('Not implemented yet!');

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

async function handleConnect(interaction) {
    const channel = interaction.member.voice.channel;

    const connection = getOrCreateVoiceConnection(interaction, channel);
    if (connection) {
        await interaction.editReply(`✅ Connected to ${channel.name}`);
    } else {
        await interaction.editReply('❗ Failed to connect to the voice channel.');
    }
}

async function handleDisconnect(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.member.voice.channel;

    const connection = getVoiceConnection(guildId);

    if (connection) {
        connection.destroy();
        console.log(`Disconnected from ${channel.name} in ${interaction.guild.name}`);
        await interaction.editReply(`☑️ Disconnected from ${channel.name}`);
    } else{
        console.log("Not connected to a voice channel.")
        await interaction.editReply('❗ Not connected to a voice channel.');
    }
}

function getOrCreateVoiceConnection(interaction, channel, selfDeaf = true, selfMute = true) {
    const guildId = interaction.guild.id;
    const voiceChannel = interaction.member.voice.channel;

    try{
        const connection = getVoiceConnection(guildId) ??
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf,
                selfMute,
            });

        // Ensure the connection is set up correctly
        connection.selfDeaf = selfDeaf;
        connection.selfMute = selfMute;

        console.log(`Connected to ${voiceChannel.name} in ${interaction.guild.name}`);
        return connection;

    } catch (error) {
        console.error('Failed to connect to voice channel:', error);
        return null;
    }
}