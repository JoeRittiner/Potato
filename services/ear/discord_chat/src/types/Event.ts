export interface DiscordEvent {
    name: string;
    once: boolean | undefined;
    execute(...args: any[]): void;
}