const { SlashCommandBuilder, MessageFlags } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('vc')
		.setDescription('Manage voice chat functionality')
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('listen')
		        .setDescription('Enable voice chat listening mode'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('disable')
		        .setDescription('Disable voice chat functionality'))
		.addSubcommand(subcommand =>
		    subcommand
		        .setName('status')
		        .setDescription('Check voice chat status')),

	async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        console.log(`${subcommand} command executed`);

        switch (subcommand) {
        case 'listen':
            await interaction.deferReply();

            console.warn("Not implemented yet");

            return await interaction.editReply('Not implemented yet!');

        case 'disable':
            await interaction.deferReply();

            console.warn("Not implemented yet");

            return await interaction.editReply('Not implemented yet!');

        case 'status':
            await interaction.deferReply();

            console.warn("Not implemented yet");

            return await interaction.editReply('Not implemented yet!');

        default:
            return await interaction.reply({ content: ':interrobang: Unknown subcommand. Please use a valid subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};