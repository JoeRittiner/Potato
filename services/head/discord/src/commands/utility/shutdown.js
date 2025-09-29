const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    category: 'Utility',
	data: new SlashCommandBuilder()
		.setName('shutdown')
		.setDescription('Shuts down the bot')
		.setDefaultMemberPermissions(PermissionFlagsBits.Owner),
	async execute(interaction) {
        await interaction.reply({ content: 'Shutting down...' });
        interaction.client.emit('shutdown', interaction.client, "MANUAL");
	},
};