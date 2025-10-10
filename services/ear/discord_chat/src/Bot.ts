import { Client, Collection, Events, GatewayIntentBits, Message, Partials } from 'discord.js';
import { loadCommands } from './managers/CommandManager.js';
import { registerEvents } from './managers/EventManager.js';
import { Command } from './types/Command.js';


export class Bot extends Client {

    public commands: Collection<string, Command>;
    public messageHandler: CallableFunction | null = null;

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
                // TODO: implement RMQ sending logic
            }
        )
        
    }

    async start(token: string) {

        await loadCommands(this, '../commands');
        await registerEvents(this, '../events');

        await this.login(token);
    }
}