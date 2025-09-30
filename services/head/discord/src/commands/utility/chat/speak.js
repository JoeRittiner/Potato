// const { Message } = require('amqplib/callback_api')
const { startMouthConsumer, stopMouthConsumer} = require('../../../rmq/textMouth.js');

module.exports = {
    startSpeaking,
    stopSpeaking,
}

function startSpeaking(client) {
    console.log("[Speak] Staring posting messages from RabbitMQ");
    if (!client.messagePublisher) {
        client.messagePublisher = async (message) => {
            await handleMessage(client, message);
        }
    } else {
        console.log("[Speak] Message publisher already exists");
    }

    if (!client.mouthConsumerTag) {
        startMouthConsumer(client);
        console.log("[Speak] Mouth consumer started");
    }

    client.on("rmqMessage", client.messagePublisher)
}

function stopSpeaking(client) {
    console.log("[Speak] Stopping posting messages from RabbitMQ");
    if (client.messagePublisher) {
        client.off("rmqMessage", client.messagePublisher);
        client.messagePublisher = null;
        console.log("[Speak] Message poster removed");
    } else {
        console.log("[Speak] No message poster found");
    }

    if (client.mouthConsumerTag) {
        stopMouthConsumer(client);
        console.log("[Speak] Consumer removed");
    } else {
        console.log("[Speak] No consumer found");
    }
}

async function handleMessage(client, message) {
    console.log("[Speak] Received message from RabbitMQ");

    const content = message.content.toString();
    const headers = message.properties.headers || {};

    let discordChannel;

    if (!headers.originalChannelId) {
        console.warn("[Speak] Received message without originalChannelId, skipping.");
    } else {
        discordChannel = await client.channels.fetch(headers.originalChannelId);
        await discordChannel.send(content);
        console.log(`[Speak] Sent message to ${discordChannel.name}`);
    }
}