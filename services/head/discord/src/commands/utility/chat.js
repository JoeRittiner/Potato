const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { startListening, stopListening } = require('./chat/listen.js');
const { startSpeaking, stopSpeaking } = require('./chat/speak.js');
const { getStatus } = require('../../rmq/RMQConnection.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Manage chat functionality')
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('listen')
		        .setDescription('Enable chat listening mode'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('speak')
		        .setDescription('Enable chat speak mode'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('disable')
		        .setDescription('Disable chat functionality'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('status')
		        .setDescription('Check chat status')),

	async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        console.log(`${subcommand} command executed`);


        switch (subcommand) {
        case 'listen':
            await interaction.deferReply();
            startListening(interaction.client);
            return await interaction.editReply(':ear: Listening to what you have to say!');
        case 'speak':
            startSpeaking(interaction.client);
            await interaction.deferReply();
            return await interaction.editReply(':mouth: Speaking my mind!');
        case 'disable':
            await interaction.deferReply();
            stopListening(interaction.client);
            stopSpeaking(interaction.client);
            return await interaction.editReply(':hear_no_evil: Deafened and muted!');
        case 'status':
            await interaction.deferReply({flags: MessageFlags.Ephemeral});
            const { earListener, mouthPublisher, connection, channel } = getStatus(interaction.client);
            const earStatus = `${earListener ? '✔️' : '❌'} Ear is ${earListener ? 'ready' : 'not ready'}`;
            const mouthStatus = `${mouthPublisher ? '✔️' : '❌'} Mouth is ${mouthPublisher ? 'ready' : 'not ready'}`;
            const connectionStatus = `${connection ? '✔️' : '❌'} Connection: ${connection ? 'connected' : 'disconnected'}`;
            const channelStatus = `${channel ? '✔️' : '❌'} Channel: ${channel ? 'active' : 'inactive'}`;
            return await interaction.editReply(`${earStatus}\n${mouthStatus}\n${connectionStatus}\n${channelStatus}`);
        default:
            return await interaction.reply({ content: ':interrobang: Unknown subcommand. Please use a valid subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};