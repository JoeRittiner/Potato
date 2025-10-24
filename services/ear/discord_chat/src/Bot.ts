import { Client, Collection, Events, GatewayIntentBits, Message, Partials } from 'discord.js';
import { loadCommands } from './managers/CommandManager.js';
import { registerEvents } from './managers/EventManager.js';
import { Command } from './types/Command.js';
import { RMQManager } from './managers/RMQManager.js';


export class Bot extends Client {

    public commands: Collection<string, Command>;
    public rmqManager: RMQManager = new RMQManager();

    private listening: boolean = false;

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

        this.on(
            Events.MessageCreate, (message: Message) => {
                if (!this.listening) return;
                console.log(`Sending message: '${message.content}'`)
                try {
                    // TODO: make configurable what queue to send to
                    this.rmqManager.sendToQueue('ear_to_brain', message.content);
                } catch (error) {
                    console.error('Error sending message to RMQ:', error);
                }
            }
        )
        
    }

    async start(token: string) {

        await loadCommands(this, '../commands');
        await registerEvents(this, '../events');

        try {
            await this.rmqManager.connect();
        } catch (error) {
            console.error('Error connecting to RMQ:', error);
        }

        await this.login(token);
    }

    async stop() {
        try {
            await this.rmqManager.disconnect();
        } catch (error) {
            console.error('Error disconnecting from RMQ:', error);
        }
        await this.destroy();
    }
}