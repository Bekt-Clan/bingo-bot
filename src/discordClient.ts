import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    Client,
    Collection,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
} from 'discord.js';

import type {
    DiscordCommandDetails,
    DiscordEventDetails,
    ModifiedDiscordClient,
} from './types/discordClient.js';

import { Environment } from './services/environment.js';

let client: ModifiedDiscordClient;

export const initialize = async () => {
    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    // Load all commands from dir/subdirs on start
    client.commands = new Collection();
    const foldersPath = './commands';
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs
            .readdirSync(commandsPath)
            .filter(
                (file) => file.endsWith('.ts') && !file.endsWith('.test.ts')
            );
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command: DiscordCommandDetails = await import(
                `file://${filePath}`
            );

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.log(
                    `[WARNING] (RUN) The command at ${filePath} is missing a required "data" or "execute" property.`
                );
            }
        }
    }

    // Load all event handlers from dir on start
    const eventsPath = './events';
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event: DiscordEventDetails = await import(`file://${filePath}`);

        if (event.once) {
            client.once(event.name, (...args: unknown[]) =>
                event.execute(...args)
            );
        } else {
            client.on(event.name, (...args: unknown[]) =>
                event.execute(...args)
            );
        }
    }

    // Re-deploy the commands to Discord
    const rest = new REST().setToken(Environment.DISCORD_BOT_TOKEN);

    try {
        console.log(
            `Started refreshing ${
                client.commands?.size || 0
            } application (/) commands.`
        );

        // Fully redeploy all commands at the guild level
        const data = await rest.put(
            Routes.applicationGuildCommands(
                Environment.DISCORD_APP_ID,
                Environment.GUILD_ID
            ),
            {
                body: Array.from(client.commands, ([_, details]) =>
                    (details as DiscordCommandDetails).data.toJSON()
                ),
            }
        );

        console.log(
            `Successfully reloaded ${
                (data as unknown[])?.length || 0
            } application (/) commands.`
        );
    } catch (error) {
        console.error('Could not reload commands:', error);
    }

    await client.login(Environment.DISCORD_BOT_TOKEN);
};

export const getDiscordClient = () => {
    return client;
};
