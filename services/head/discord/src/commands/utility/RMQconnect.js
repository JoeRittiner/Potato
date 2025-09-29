const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { connectToRabbitMQ } = require('../../rmq.js');

module.exports = {
    category: 'Utility',
	data: new SlashCommandBuilder()
		.setName('connect')
		.setDescription('Connect to RabbitMQ')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild),
	async execute(interaction) {
		try {
	    	await interaction.reply({
	    	    content: '🔌 Connecting to RabbitMQ...',
	    	    flags: MessageFlags.Ephemeral
	    	});
    		await connectToRabbitMQ(interaction.client);
    		console.log('Successfully connected to RabbitMQ');
            await interaction.editReply({
                content: '✅ Successfully connected to RabbitMQ!',
                flags: MessageFlags.Ephemeral
            });
    	} catch (error) {
        	console.error('RabbitMQ connection error:', error);
            await interaction.editReply({
                content: `❌ Failed to connect to RabbitMQ: ${error.message || 'Unknown error'}`,
                flags: MessageFlags.Ephemeral
            });
    	}
	},
};