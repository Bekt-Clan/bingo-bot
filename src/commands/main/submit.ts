import {
    SlashCommandBuilder,
    AttachmentBuilder,
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    Attachment,
} from 'discord.js';
import Fuse from 'fuse.js';

import { Environment } from '../../services/environment.js';
import sheets from '../../services/sheets.js';
import tiles from '../../services/tiles.js';

const tileSearcher = new Fuse(tiles, {});

export const data = new SlashCommandBuilder()
    .setName('submit')
    .setDescription('Submit a bingo drop.')
    .addStringOption((option) =>
        option
            .setName('tile_name')
            .setDescription(
                'Name of the tile you are submitting (must match name on sheet)'
            )
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addAttachmentOption((option) =>
        option
            .setName('drop_image')
            .setDescription(
                'Image showing your drop (w/ timestamp and key word!)'
            )
            .setRequired(true)
    );
export const autocomplete = async (interaction: AutocompleteInteraction) => {
    const focusedValue = interaction.options.getFocused();
    if (focusedValue == '') {
        await interaction.respond(
            tiles.slice(0, 25).map((tile) => ({ name: tile, value: tile }))
        );
        return;
    }
    const results = tileSearcher.search(focusedValue);
    await interaction.respond(
        results
            .slice(0, 25)
            .map((tile) => ({ name: tile.item, value: tile.item }))
    );
    return;
};
export const execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ ephemeral: false });

    let teamSheetID = '';

    if (interaction.guild === null) {
        await interaction.editReply('Invalid guild. Command aborted.');
        console.error('Null interaction guild in submit command.');
        return;
    }

    if (interaction.channel === null) {
        await interaction.editReply('Invalid channel. Command aborted.');
        console.error('Null interaction channel in submit command.');
        return;
    }

    const tileName: string | null = interaction.options.getString('tile_name');
    if (tileName === null) {
        await interaction.editReply('Invalid tile. Command aborted.');
        console.error('Null tile_name in submit command.');
        return;
    }

    const dropImage: NonNullable<Attachment | undefined> | null =
        interaction.options.getAttachment('drop_image');
    if (dropImage === null) {
        await interaction.editReply(
            'Invalid image submission. Command aborted.'
        );
        console.error('Null drop_image in submit command.');
        return;
    }

    if (interaction.channel.id in Environment.CHANNEL_TO_SHEET_ID_MAP) {
        teamSheetID =
            Environment.CHANNEL_TO_SHEET_ID_MAP[interaction.channel.id];
    } else {
        await interaction.editReply(
            "This isn't a valid channel for drop submissions!"
        );
        return;
    }

    const tileNameIdx = tiles.indexOf(tileName);
    const tileSheetCol = tileNameIdx + 2;

    if (tileNameIdx == -1) {
        console.log(
            `Invalid tile name: ${interaction.options.getString('tile_name')}`
        );
        await interaction.editReply('Invalid tile name.');
        return;
    }

    /*
    TODO: This can be improved! We should set it up so that
    we have a dir of modules that abstract this and then we can
    preserve them event to event and just rewrite a new drop-in
    module for that specific event
    */
    // Mark tile submitted, and save the timestamp and msg link
    try {
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: teamSheetID,
            requestBody: {
                valueInputOption: 'RAW',
                data: [
                    {
                        // Mark tile submitted
                        range: `Drop List!C${tileSheetCol}`,
                        values: [['Yes']],
                    },
                    {
                        // Record timestamp
                        range: `Drop List!E${tileSheetCol}`,
                        values: [[new Date().toUTCString()]],
                    },
                    {
                        // Record msg link
                        range: `Drop List!F${tileSheetCol}`,
                        values: [
                            [
                                `https://discord.com/channels/${interaction.guild.id}/${interaction.channelId}/${interaction.id}`,
                            ],
                        ],
                    },
                    {
                        // Set approved to false
                        range: `Drop List!G${tileSheetCol}`,
                        values: [['No']],
                    },
                ],
            },
        });
    } catch (err) {
        console.error(`Error marking tile complete: ${err}`);
        await interaction.editReply('An error occurred. Please contact staff.');
        throw err;
    }

    await interaction.editReply({
        content: `"${interaction.options.getString(
            'tile_name'
        )}" tile submission successful!`,
        files: [new AttachmentBuilder(dropImage.url)],
    });
    return;
};
