const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');


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
        console.log(`/vc ${subcommand} command executed`);

        // Ensure the user is in a voice channel
        const channel = interaction.member.voice.channel;
        if (!channel) {
            console.log(`${interaction.user.tag} is not in a voice channel`)
            return interaction.reply({ content: '❗ You are not in a voice channel.', flags: MessageFlags.Ephemeral });
        }

        switch (subcommand) {
        case 'listen':
            console.warn("Not implemented yet");

            return await interaction.reply('Not implemented yet!');

        case 'disable':

            console.warn("Not implemented yet");

            return await interaction.reply('Not implemented yet!');

        case 'status':

            console.warn("Not implemented yet");

            return await interaction.reply('Not implemented yet!');

        default:
            console.warn(`Unknown subcommand ${subcommand}`);
            return await interaction.reply({ content: ':interrobang: Unknown subcommand. Please use a valid subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};