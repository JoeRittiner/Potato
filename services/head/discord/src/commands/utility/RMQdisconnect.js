const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { disconnectFromRabbitMQ } = require('../../rmq/RMQConnection.js');

module.exports = {
    category: 'Utility',
	data: new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnect from RabbitMQ')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
	    const connection = interaction.client.RMQConnection;

        if (!connection) { // Only check if the connection exists. TODO: Check if the connection is open.
            await interaction.reply({
                content: '❌ Not connected to RabbitMQ!',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

		try {
	    	await interaction.reply({
	    	    content: '🔌 Disconnecting from RabbitMQ...' ,
	    	    flags: MessageFlags.Ephemeral
	    	});
	    	await disconnectFromRabbitMQ(interaction.client);
	    	console.log('Successfully disconnected from RabbitMQ');
	    	await interaction.editReply({
	    	    content: '☑️ Successfully disconnected from RabbitMQ!',
	    	    flags: MessageFlags.Ephemeral
	    	});
	    } catch (error) {
	        console.error('RabbitMQ disconnection error:', error);
	        // TODO: Check if the connection is not closed.
	        await interaction.editReply({
	            content: `❌ Failed to disconnect from RabbitMQ: ${error.message || 'Unknown error'}`,
	            flags: MessageFlags.Ephemeral
	        });
	    }
	},
};