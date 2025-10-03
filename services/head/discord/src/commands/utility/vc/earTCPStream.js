const { joinVoiceChannel } = require('@discordjs/voice');

const { setupReceiver } = require('./earTCPHelpers.js');

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
    }

    // Reconnect to voice channel, with different settings
    const conn = joinVoiceChannel({
                    channelId: client.voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: client.selfMute ?? true,
                });

    client.voiceConnection = conn;
    client.selfDeaf = false;

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
    
    const conn = joinVoiceChannel({
                    channelId: client.voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true,
                    selfMute: client.selfMute ?? true,
                });

    client.voiceConnection = conn;
    client.selfDeaf = true;

    conn.receiver.speaking.removeAllListeners();
    
    console.log('Stopped listening to voice channel');

    return true;

}