const { Client } = require("discord.js");
const amqp = require('amqplib/callback_api');

const RabbitMQ_Host = process.env.RMQ_HOST;
const RabbitMQ_Port = process.env.RMQ_PORT;
const RabbitMQ_URL = `amqp://${RabbitMQ_Host}:${RabbitMQ_Port}`;

module.exports = {
    connectToRabbitMQ,
    disconnectFromRabbitMQ,
    getStatus
}

/**
 * @param {Client} client
 */
async function connectToRabbitMQ(client) {
    return new Promise((resolve, reject) => {
        amqp.connect(RabbitMQ_URL, (err, conn) => {
            if (err) {
                console.error("Connection error:", err);
                return reject(err);
            }
            client.RMQConnection = conn;
            client.RMQConnection.createChannel((err, ch) => {
                if (err) {
                    console.error("[x] Channel creation error:", err);
                    return reject(err);
                }
                client.RMQChannel = ch;
                console.log("[x] Connected to RabbitMQ");
                resolve();
            });
        });
    });
}

/**
 * @param {Client} client
 */
async function disconnectFromRabbitMQ(client) {
    return new Promise((resolve, reject) => {
        client.RMQConnection.close((err) => {
            if (err) {
                console.error("Connection close error:", err);
                return reject(err);
            }
            console.log("[x] Disconnected from RabbitMQ");
            resolve();
        });
    });
}

function getStatus(client) {
    return {
        earListening: client.messageListener,
        connection: !!client.RMQConnection,
        channel: !!client.RMQChannel,
    }
}