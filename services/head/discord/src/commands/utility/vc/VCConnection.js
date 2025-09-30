const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    getOrCreateVoiceConnection
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