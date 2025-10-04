const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    deafen,
    mute,
    unDeafen,
    unMute,
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