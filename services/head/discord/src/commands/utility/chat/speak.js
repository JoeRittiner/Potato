// const { Message } = require('amqplib/callback_api')
const { startMouthConsumer, stopMouthConsumer} = require('../../../rmq/textMouth.js');

module.exports = {
    startSpeaking,
    stopSpeaking,
}

function startSpeaking(client) {
    console.log("Staring posting messages from RabbitMQ");
    if (!client.messagePublisher) {
        client.messagePublisher = async (message) => {
            await handleMessage(client, message);
        }
    } else {
        console.log("Message publisher already exists");
    }

    if (!client.mouthConsumerTag) {
        startMouthConsumer(client);
        console.log("Mouth consumer started");
    }

    client.on("rmqMessage", client.messagePublisher)
}

function stopSpeaking(client) {
    console.log("Stopping posting messages from RabbitMQ");
    if (client.messagePublisher) {
        client.off("rmqMessage", client.messagePublisher);
        console.log("Message poster removed");
        client.messagePublisher = null;
    } else {
        console.log("No message poster found");
    }

    if (client.mouthConsumerTag) {
        stopMouthConsumer(client);
        console.log("Mouth consumer removed");
    }
}

async function handleMessage(client, message) {
    console.log("Received message from RabbitMQ");

    const content = message.content.toString();
    const headers = message.properties.headers || {};

    let discordChannel;

    if (!headers.originalChannelId) {
        console.warn("[Mouth] Received message without originalChannelId, skipping.");
    } else {
        discordChannel = await client.channels.fetch(headers.originalChannelId);
        await discordChannel.send(content);
        console.log(`[Mouth] Sent message to ${discordChannel.name}`);
    }
}