
module.exports = {
    earPublish
};

const queue = 'ear_to_brain'; // TODO: Make this configurable

function earPublish(client, message) {
    if (!client.RMQChannel) {
        console.log("[Ear] RabbitMQ is not connected");
        return;
    }

    client.RMQChannel.sendToQueue(queue, Buffer.from(message.content), {
        correlationId: message.author.id,
        headers: {
            user: message.author.username,
            originalChannelId: message.channel.id,
            messageId: message.id,
        }
     });
     console.log(`[Ear] Published message to ${queue}`)
}