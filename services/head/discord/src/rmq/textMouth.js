module.exports = {
    startMouthConsumer,
    stopMouthConsumer
}

const queue = 'brain_to_mouth'; // TODO: Make this configurable

async function startMouthConsumer(client) {
    if (!client.RMQChannel) {
        console.log("[Mouth] RabbitMQ is not connected");
        return;
    }
    console.log("[Mouth] Starting listener...");

    client.RMQChannel.consume(queue, async (msg) => {
        if (!msg || !msg.content) {
            console.error("[Mouth] Received null message");
            return;
        }
        client.emit("rmqMessage", msg);
        console.log(`[Mouth] Message received from ${msg.properties.correlationId}`);

        client.RMQChannel.ack(msg);
    }, {
        noAck: false,
    }, (err, ok) => {
        if (err) {
            console.error("[Mouth] Error consuming message:", err);
            return;
        }
        consumerTag = ok.consumerTag;
        console.log(`[Mouth] Consuming messages on ${queue} with consumer tag ${consumerTag}`);
    });
    console.log("[Mouth] Consumer started");
}

function stopMouthConsumer(client) {
    if (!client.RMQChannel || !client.consumerTag) {
        console.log("[Mouth] Not currently listening");
        return;
    }
    console.log("[Mouth] Stopping consumer");
    try {
        client.RMQChannel.cancel(client.consumerTag);
        client.mouthConsumerTag = null;
    } catch (error) {
        console.error("[Mouth] Error stopping consumer:", error);
    }
}