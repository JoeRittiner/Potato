const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { startSpeaking, stopSpeaking } = require('./chat/speak.js');
const { getStatus } = require('../../rmq/RMQConnection.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Manage chat functionality')
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
        console.log(`/chat ${subcommand} command executed`);

        switch (subcommand) {
            case 'speak':
                await interaction.deferReply();

                startSpeaking(interaction.client);

                return await interaction.editReply(':mouth: Speaking my mind!');

            case 'disable':
                await interaction.deferReply();

                stopSpeaking(interaction.client);

                return await interaction.editReply(':hear_no_evil: Deafened and muted!');

            case 'status':
                await interaction.deferReply({flags: MessageFlags.Ephemeral});

                const { mouthPublisher, connection, channel } = getStatus(interaction.client);
                const mouthStatus = `${mouthPublisher ? '✔️' : '❌'} Mouth is ${mouthPublisher ? 'ready' : 'not ready'}`;
                const connectionStatus = `${connection ? '✔️' : '❌'} Connection: ${connection ? 'connected' : 'disconnected'}`;
                const channelStatus = `${channel ? '✔️' : '❌'} Channel: ${channel ? 'active' : 'inactive'}`;

                return await interaction.editReply(`${mouthStatus}\n${connectionStatus}\n${channelStatus}`);

            default:
                // Ignore unknown subcommands. Potentially let other Bot modules handle them.
                console.debug(`Unknown subcommand '$/chat ${subcommand}'. Ignoring.`);
                return;
        }
    }
};