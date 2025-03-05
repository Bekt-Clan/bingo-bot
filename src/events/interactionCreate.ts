import { BaseInteraction, Events } from 'discord.js';

import { ModifiedDiscordClient } from '../types/discordClient.js';

export const name = Events.InteractionCreate;

export const execute = async (interaction: BaseInteraction) => {
    if (interaction.isChatInputCommand()) {
        const command = (
            interaction.client as ModifiedDiscordClient
        ).commands?.get(interaction.commandName);

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
        }
    } else if (interaction.isButton()) {
        // Un-Used currently
    } else if (interaction.isStringSelectMenu()) {
        // Un-Used currently
    } else if (interaction.isAutocomplete()) {
        const command = (
            interaction.client as ModifiedDiscordClient
        ).commands?.get(interaction.commandName);

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
    }
};
