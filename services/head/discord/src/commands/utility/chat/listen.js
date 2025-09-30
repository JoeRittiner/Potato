const { Events, ChannelType, MessageFlags } = require('discord.js');
const { earPublish } = require('../../../rmq/textEar.js');

module.exports = {
    startListening,
    stopListening,
}

function startListening(client) {
    console.log("Listening for Messages");
    if (!client.messageListener) {
        client.messageListener = (message) => {
            console.log("Received message");
            handleMessage(client, message);
        };
    } else {
        console.log("Message listener already exists");
    }
    client.on(Events.MessageCreate, client.messageListener);
}


function stopListening(client){
    console.log("Stopping listening for Messages");
    if (client.messageListener) {
        client.off(Events.MessageCreate, client.messageListener);
        console.log("Message listener removed");
        client.messageListener = null;
    } else {
        console.log("No message listener found");
    }
}

/**
 * @param {Client} client
 * @param {Message} message
 */
async function handleMessage(client, message) {
    if (message.author.bot) return;  // Ignore bot messages

    if (!message.channel) return; // Ensure the channel exists

    if (message.channel.type === ChannelType.DM) {
        return handleDMMessage(client, message);
    } else if (message.channel.type === ChannelType.GuildText) {
        return handleGuildTextMessage(client, message);
    } else if (message.channel.type === ChannelType.GuildVoice) {
        console.log(`Received a message in a voice channel: ${message.content}`);
        return message.reply({ content: "I can't process messages in voice channels. Please use text channels.", flags: MessageFlags.Ephemeral });
    } else {
        console.error(`Received a message in an unknown channel type: ${message.channel.type}`);
        return message.reply({ content: "I can't process messages in this channel. Please use a text channel.", flags: MessageFlags.Ephemeral });
    }
}

function handleDMMessage(client, message) {
    console.log(`Received DM from ${message.author.tag}: ${message.content}`);
    if (message.author.bot) return; // Ignore bot messages
    earPublish(client, message); // Publish the message to RabbitMQ for processing
}

function handleGuildTextMessage(client, message) {
    console.log(`Received message: ${message.content} from ${message.author.tag} in guild ${message.guild ? message.guild.name : 'DM'} (channel ID: ${message.channel.id})`);
    if (message.author.bot) return; // Ignore bot messages
    earPublish(client, message); // Publish the message to RabbitMQ for processing
}