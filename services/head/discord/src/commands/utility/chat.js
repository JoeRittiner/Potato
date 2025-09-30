const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { startListening, stopListening } = require('./chat/listen.js');
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
            return await interaction.editReply(':ear: Listening to what you have to say!');;
        case 'disable':
            await interaction.deferReply();
            stopListening(interaction.client);
            stopSpeaking(interaction.client);
            return await interaction.editReply(':hear_no_evil: Deafened and muted!');
        case 'status':
            await interaction.deferReply();
            const { earListening, connection, channel } = getStatus(interaction.client);
            const earStatus = `${earListening ? '✔️' : '❌'} Ear is ${earListening ? 'ready' : 'not ready'}`;
            const connectionStatus = `${connection ? '✔️' : '❌'} Connection: ${connection ? 'connected' : 'disconnected'}`;
            const channelStatus = `${channel ? '✔️' : '❌'} Channel: ${channel ? 'active' : 'inactive'}`;
            return await interaction.editReply({
                content: `${earStatus}\n${connectionStatus}\n${channelStatus}`,
                flags: MessageFlags.Ephemeral
            });
        default:
            return await interaction.reply({ content: ':interrobang: Unknown subcommand. Please use a valid subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};