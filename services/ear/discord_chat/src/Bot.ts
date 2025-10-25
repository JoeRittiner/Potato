import { Client, Collection, Events, GatewayIntentBits, Message, Partials } from 'discord.js';
import { loadCommands } from './managers/CommandManager.js';
import { registerEvents } from './managers/EventManager.js';
import { Command } from './types/Command.js';
import { RMQManager } from './managers/RMQManager.js';


export class Bot extends Client {

    public commands: Collection<string, Command>;
    public rmqManager: RMQManager = new RMQManager();

    private _listening: boolean = false;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [
                Partials.Channel, 
                Partials.Message
            ],
        });
        this.commands = new Collection<string, Command>(); // Will be overwritten

        this.rmqManager.on('connected', () => {
            console.log('RMQ connected.');
        });

        this.rmqManager.on('channel_open', (channel) => {
            console.log('RMQ channel opened.');
        });

        this.rmqManager.on('disconnected', () => {
            this.listening = false;
            console.log('RMQ disconnected, disabling listening mode');
        });
        
        this.rmqManager.on('error', (error) => {
            console.error('RMQ error event:', error);
        });

        this.on(Events.MessageCreate, (message: Message) => this.onMessage(this.rmqManager, message));
    }

    // Settup for later expansion. Hence the injection of rmqManager.
    private onMessage(rmqManager: RMQManager,  message: Message) {
        if (!this.listening) return;
        console.log(`Sending message: '${message.content}'`)
        try {
            // TODO: make configurable what queue to send to
            rmqManager.sendMessage('ear_to_brain', message.content);
        } catch (error) {
            console.error('Error sending message to RMQ:', error);
        }
    }

    public set listening(value: boolean) {
        this._listening = value && this.ready();
    }

    public get listening(): boolean {
        return this._listening;
    }

    private ready(): boolean {
        return this.rmqManager.connection !== null && this.rmqManager.channel !== null;
    }

    public async start(token: string) {
        await loadCommands(this, '../commands');
        await registerEvents(this, '../events');

        try {
            await this.rmqManager.connect();
        } catch (error) {
            console.error('Error connecting to RMQ:', error);
        }

        await this.login(token);
    }

    public async stop() {
        try {
            await this.rmqManager.disconnect();
        } catch (error) {
            console.error('Error disconnecting from RMQ:', error);
        }
        await this.destroy();
    }
}