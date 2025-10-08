const { SlashCommandBuilder, MessageFlags, ChannelType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { startEar, stopEar } = require('./vc/earTCPStream.js');
const { startMouth, stopMouth } = require('./vc/mouthTCPServer.js');
const { connect, disconnect } = require('./vc/vcHelpers.js');


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
		        .setName('speak')
		        .setDescription('Enable voice chat speaking mode'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('deafen')
		        .setDescription('Deafen the bot'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('mute')
		        .setDescription('Mute the bot'))
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

            await interaction.reply({ content: `🔌 Connecting to <#${channel.id}>...`, flags: MessageFlags.Ephemeral });
            await connectToVC(interaction, channel);
            break;
        case 'leave':
            await interaction.reply({ content: `🔌 Disconnecting...`, flags: MessageFlags.Ephemeral });
            await disconnectFromVC(interaction);
            break;
        case 'listen':
            await interaction.deferReply();
            try {
                const success = await startEar(interaction);
                if (success) await interaction.editReply(`👂 Listening to voice activity in <#${interaction.client.voiceChannel.id}>`);
            } catch (error) {
                console.error('Failed to start listening:', error);
                await interaction.editReply('Failed to start listening');
            }
            break;
        case 'deafen':
            await interaction.deferReply();
            try {
                const success = await stopEar(interaction);
                if (success) await interaction.editReply('🙉 Bot is now deafened');
            } catch (error) {
                console.error('Failed to stop listening:', error);
                await interaction.editReply('Failed to stop listening');
            }
            break;

        case 'speak':
            await interaction.deferReply();
            try {
                const success = await startMouth(interaction);
                if (success) await interaction.editReply(`🗣️ Speaking in <#${interaction.client.voiceChannel.id}>`);
            } catch (error) {
                console.error('Failed to start speaking:', error);
                await interaction.editReply('Failed to start speaking');
            }
            break;

        case 'mute':
            await interaction.deferReply();
            try {
                const success = await stopMouth(interaction);
                if (success) await interaction.editReply('🤐 Bot is now muted');
            } catch (error) {
                console.error('Failed to stop speaking:', error);
                await interaction.editReply('Failed to stop speaking');
            }
            break;
        case 'status':
            await interaction.deferReply({flags: MessageFlags.Ephemeral});

            const {voiceConnection, voiceChannel, mouthServer, earServer, listening, speaking, deafened, muted} = getStatus(interaction.client);
            const connectionStatus = `${voiceConnection ? '✔️' : '❌'} Connection: ${voiceConnection ? 'connected' : 'disconnected'}`;
            const channelStatus = `${voiceChannel ? '✔️' : '❌'} Channel: ${voiceChannel ? `<#${voiceChannel.id}>` : 'none'}`;
            const earServerStatus = `${earServer ? '✔️' : '❌'} Ear Server: ${earServer ? 'reachable' : 'not reachable'}`;
            const mouthServerStatus = `${mouthServer ? '✔️' : '❌'} Mouth Server: ${mouthServer ? 'running' : 'not running'}`;
            const listeningStatus = `${listening ? '✔️' : '❌'} Listening: ${listening ? 'enabled' : 'disabled'}`;
            const speakingStatus = `${speaking ? '✔️' : '❌'} Speaking: ${speaking ? 'enabled' : 'disabled'}`;
            const deafenedStatus = `${deafened ? '🙉' : '🎤'} Deafened: ${deafened ? 'yes' : 'no'}`;
            const mutedStatus = `${muted ? '🔇' : '🔊'} Muted: ${muted ? 'yes' : 'no'}`;

            await interaction.editReply(`${connectionStatus}\n${channelStatus}\n\n${listeningStatus}\n${earServerStatus}\n${deafenedStatus}\n\n${speakingStatus}\n${mouthServerStatus}\n${mutedStatus}`);
            break;

        default:
            console.warn(`Unknown subcommand ${subcommand}`);
            return await interaction.reply({ content: '⁉️ Unknown subcommand. Please use a valid subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};

async function connectToVC(interaction, voiceChannel) {
    const client = interaction.client;
    if (client.voiceConnection){
        console.log(`Already connected to ${client.voiceChannel.name}`);
        interaction.editReply(`ℹ️ Already connected to <#${client.voiceChannel.id}>`);
        return;
    } else {
        try {
            client.voiceConnection = connect(client, voiceChannel);
            client.voiceChannel = voiceChannel;

            console.log(`Connected to ${voiceChannel.name} in ${interaction.guild.name}`);
            await interaction.editReply(`✅ Connected to <#${voiceChannel.id}>`);
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
            client.conn = disconnect(client);
            client.earListening = false;
            client.mouthSpeaking = false;

            console.log(`Disconnected from ${client.voiceChannel.name} in ${interaction.guild.name}`);
            await interaction.editReply(`☑️ Disconnected from <#${client.voiceChannel.id}>`);

            client.voiceChannel = null;
            client.voiceConnection = null;
        } catch (error) {
            console.error('Failed to disconnect from voice channel:', error);
            await interaction.editReply('❗ Failed to disconnect from the voice channel.');
        }
    } else {
        console.log(`Not connected to any voice channel`);
        await interaction.editReply(`ℹ️ Not connected to any voice channel`);
    }
}

function getStatus(client) {
    return {
        voiceConnection : client.voiceConnection ?? null,
        voiceChannel : client.voiceChannel ?? null,

        // TODO: check if servers are actually running/reachable
        earServer : null,
        mouthServer : client.mouthServer ? client.mouthServer.listening : null,

        listening: client.earListening ?? false,
        speaking: client.mouthSpeaking ?? false,

        deafened: client.selfDeaf ?? true,
        muted: client.selfMute ?? true,
    }
} 