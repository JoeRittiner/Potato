// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials, Events } = require('discord.js');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message]
});

client.RMQConnection = null;  // RabbitMQ Connection
client.RMQChannel = null;     // RabbitMQ Channel
client.messageListener = null;  // RabbitMQ Ear is Listening
client.mouthConsumerTag = null; // RabbitMQ Mouth Consumer Tag

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {

	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// Handle shutdown signals with proper binding and debugging
const signals = ['SIGTERM', 'SIGINT'];

signals.forEach(signal => {
    process.on(signal, () => {
        console.log(`Received ${signal} at ${new Date().toISOString()}`);
        console.log('Emitting shutdown event...');
        client.emit('shutdown', client, signal);
    });
});

// Log in to Discord with the client's token
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN is not set in .env file!');
    process.exit(1);
} else {
    client.login(token)
        .catch(error => {
            console.error('Failed to log in:', error);
            process.exit(1);
        });
}