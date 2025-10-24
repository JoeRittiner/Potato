import amqp from 'amqplib/callback_api.js';

const HOST = process.env.RMQ_HOST || 'localhost';
const PORT = process.env.RMQ_PORT || '5672'
const URL = `amqp://${HOST}:${PORT}`;

export class RMQManager {
    private url: string;

    public connection: any;
    public channel: any;

    constructor(url: string = URL) {
        this.url = url;
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection) {
                console.info('Already connected to RabbitMQ');
                return resolve();
            }

            amqp.connect(this.url, (error0: any, connection: any) => {
                if (error0) {
                    console.error('Failed to connect to RabbitMQ:', error0);
                    return reject(error0);
                }
                this.connection = connection;
                console.log('Connected to RabbitMQ');
                connection.createChannel((error1: any, channel: any) => {
                    if (error1) {
                        console.error('Failed to create channel:', error1);
                        return reject(error1);
                    }
                    this.channel = channel;
                    console.log('Channel created');
                    resolve();
                });

                if (!this.connection) {
                    console.error('Connection is null after connect call');
                    return reject(new Error('Connection is null after connect call'));
                }
                
                console.log(`Connection state after connect call: ${this.connection}`);

                this.connection.on('error', (err: any) => {
                    console.error('RabbitMQ connection error:', err);
                    this.connection = null;
                    this.channel = null;
                });

                this.connection.on('close', () => {
                    console.info('RabbitMQ connection closed');
                    this.connection = null;
                    this.channel = null;
                });
            });
        });
    }

    public async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                console.warn('No RabbitMQ connection to close');
                return resolve();
            }
            this.connection.close((error: any) => {
                if (error) {
                    console.error('Failed to close RabbitMQ connection:', error);
                    return reject(error);
                }
                console.log('RabbitMQ connection closed');
                resolve();
            });
            console.log(`Connection state after close call: ${this.connection}`);
        });
    }
}