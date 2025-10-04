const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    connect,
    disconnect,
    deafen,
    mute,
    unDeafen,
    unMute,
}

function connect (client, voiceChannel) {
    const guild = voiceChannel.guild;
    const conn = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true,
        });
    client.selfDeaf = true;
    client.selfMute = true;

    return conn;
}

function disconnect (client) {
    client.voiceConnection.destroy();
    client.selfDeaf = true;
    client.selfMute = true;

    return null;
}

function deafen (client, guild) {
    client.selfDeaf = true;
    return reJoinVoiceChannel(client, guild);
}

function mute (client) {
    client.selfMute = true;
    return reJoinVoiceChannel(client, guild);
}

function unDeafen (client, guild) {
    client.selfDeaf = false;
    return reJoinVoiceChannel(client, guild);
}

function unMute (client) {
    client.selfMute = false;
    return reJoinVoiceChannel(client, guild);
}

function reJoinVoiceChannel(client, guild) {
    if (!client.voiceChannel) return null;
    const conn = joinVoiceChannel({
        channelId: client.voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: client.selfDeaf ?? true,
        selfMute: client.selfMute ?? true,
    });
    return conn;
}