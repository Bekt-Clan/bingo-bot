import { Client, Collection, SlashCommandBuilder } from 'discord.js';

export type DiscordCommandDetails = {
    name: string;
    once?: boolean;
    data: SlashCommandBuilder;
    execute: (...args: unknown[]) => Promise<void>;
    autocomplete: (...args: unknown[]) => Promise<void>;
};

export type DiscordEventDetails = {
    name: string;
    once?: boolean;
    execute: (...args: unknown[]) => Promise<void>;
};

export type ModifiedDiscordClient = Client & {
    commands?: Collection<string, DiscordCommandDetails>;
};
