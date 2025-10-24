import amqp from 'amqplib/callback_api.js';
import EventEmitter from 'events';

const HOST = process.env.RMQ_HOST || 'localhost';
const PORT = process.env.RMQ_PORT || '5672'
const URL = `amqp://${HOST}:${PORT}`;

export class RMQManager extends EventEmitter {
    private url: string;

    public connection: any;
    public channel: any;

    constructor(url: string = URL) {
        super();
        this.url = url;
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection) {
                console.debug('Already connected to RabbitMQ');
                return resolve();
            }

            amqp.connect(this.url, (error0: any, connection: any) => {
                if (error0) {
                    this.emit('error', error0);
                    return reject(error0);
                }
                this.connection = connection;
                console.log('Connected to RabbitMQ');
                connection.createChannel((error1: any, channel: any) => {
                    if (error1) {
                        this.emit('error', error1);
                        return reject(error1);
                    }
                    this.channel = channel;
                    this.emit('channel_open', channel);
                    resolve();
                });

                if (!this.connection) {
                    const err = new Error('Connection is null after connect call')
                    this.emit('error', err);
                    return reject(err);
                }

                this.connection.on('error', (err: any) => {
                    this.emit('error', err);
                    this.connection = null;
                    this.channel = null;
                });

                this.connection.on('close', () => {
                    this.emit('disconnected');
                    this.connection = null;
                    this.channel = null;
                });
            });
        });
    }

    public async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.connection) {
                return resolve();
            }
            this.connection.close((error: any) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    }

    public async sendToQueue(queueName: string, message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.channel) {
                return reject(new Error('Channel is not created'));
            }
            if (!message) {
                return reject(new Error('Message is empty'));
            }
            this.channel.sendToQueue(queueName, Buffer.from(message), {}, (error: any, _ok: any) => {
                if (error) {
                    return reject(error);
                }
                this.emit('message_sent', message);
                resolve();
            });
        });
    }

    public getStatus(): {
        connected: boolean;
        channelCreated: boolean;
    } {
        return {
            connected: !!this.connection,
            channelCreated: !!this.channel
        }
    }
}