const { mute, unMute } = require("./vcHelpers");
const { setupServer, teardownServer } = require("./mouthTCPHelpers.js");

module.exports = {
    startMouth,
    stopMouth
}

async function startMouth(interaction) {
    const client = interaction.client;
    const guild = interaction.guild;

    // Get target voice channel
    // const targetVoiceChannel = client.voiceChannel || interaction.member?.voice?.channel;

    if (!client.voiceConnection) {
        console.log('Not connected to a voice channel');
        await interaction.editReply('Can\'t start speaking. Not connected to a voice channel');
        return false;
    } else if (client.mouthSpeaking) {
        console.log('Already speaking in a voice channel');
        await interaction.editReply('Already speaking.');
        return false;
    }

    // Reconnect to voice channel, with different settings
    const conn = unMute(client, guild);
    if (!conn) {
        console.log('Failed to unmute/rejoin voice channel');
        await interaction.editReply('Failed to unmute/rejoin voice channel');
        return false;
    }

    client.voiceConnection = conn;
    client.selfMute = false;
    client.mouthSpeaking = true;

    client.mouthServer = await setupServer(conn);

    return true;
}


async function stopMouth(interaction) {
    const client = interaction.client;
    const guild = interaction.guild;
    if (!client.voiceConnection) {
        console.log('Not connected to a voice channel');
        await interaction.editReply('Can\'t stop speaking. Not connected to a voice channel');
        return false;
    }

    const conn = mute(client, guild);
    if (!conn) {
        console.log('Failed to mute/rejoin voice channel');
        await interaction.editReply('Failed to mute/rejoin voice channel');
        return false;
    }

    client.voiceConnection = conn;
    client.selfMute = true;
    client.mouthSpeaking = false;

    await teardownServer(client.mouthServer);

    return true;
}