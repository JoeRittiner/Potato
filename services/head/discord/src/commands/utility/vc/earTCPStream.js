const { joinVoiceChannel } = require('@discordjs/voice');

const { setupReceiver } = require('./earTCPHelpers.js');
const { deafen, mute, unDeafen } = require('./vcHelpers');

module.exports = {
    startEar,
    stopEar
}

async function startEar(interaction) {

    const client = interaction.client;
    const guild = interaction.guild;

    // Get target voice channel
    // const targetVoiceChannel = client.voiceChannel || interaction.member?.voice?.channel;

    if (!client.voiceConnection) {
        console.log('Not connected to a voice channel');
        await interaction.editReply('Can\'t start listening. Not connected to a voice channel');
        return false;
    } else if (client.earListening) {
        console.log('Already listening to voice channel');
        await interaction.editReply('Already listening.');
        return false;
    }

    // Reconnect to voice channel, with different settings
    const conn = unDeafen(client, guild);
    if (!conn) {
        console.log('Failed to undeafen/rejoin voice channel');
        await interaction.editReply('Failed to undeafen/rejoin voice channel');
        return false;
    }

    client.voiceConnection = conn;
    client.selfDeaf = false;
    client.earListening = true;

    await setupReceiver(
        client.voiceConnection,
        client.voiceChannel,
        guild
    )

    return true;
}

async function stopEar(interaction) {

    const client = interaction.client;
    const guild = interaction.guild;

    if (!client.voiceConnection) {
        console.log('Not connected to a voice channel');
        await interaction.editReply('Can\'t stop listening. Not connected to a voice channel');
        return false;
    } 
    
    const conn = deafen(client, guild);
    if (!conn) {
        console.log('Failed to deafen/rejoin voice channel');
        await interaction.editReply('Failed to deafen/rejoin voice channel');
        return false;
    }

    client.voiceConnection = conn;
    client.selfDeaf = true;
    client.earListening = false;

    conn.receiver.speaking.removeAllListeners();
    
    console.log('Stopped listening to voice channel');

    return true;

}