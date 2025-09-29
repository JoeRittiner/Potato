const { disconnectFromRabbitMQ } = require('../rmq/RMQConnection.js');

module.exports = {
    name: 'shutdown',
    once: true,
    async execute(client, signal) {
        console.log(`Received ${signal} at ${new Date().toISOString()}`);
        console.log('Initiating graceful shutdown...');

        try {

            // Close Discord client
            if (client && client.destroy) {
                console.log('Disconnecting from Discord...');
                await client.destroy();
                console.log('Successfully disconnected from Discord.');
            }

            // Close RabbitMQ connection if it exists
            if (client.RMQConnection) {
                console.log('Closing RabbitMQ connection...');
                await disconnectFromRabbitMQ(client);
                console.log('Successfully closed RabbitMQ connection.');
            }

            console.log('Shutdown complete. Exiting...');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    },
};