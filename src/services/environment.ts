import * as process from 'node:process';
import * as z from 'zod';
import * as dotenv from 'dotenv';
import type { JWTInput } from 'google-auth-library';

const ENVIRONMENT_SCHEMA = z.object({
    DISCORD_BOT_TOKEN: z.string(),
    DISCORD_APP_ID: z.string(),
    GUILD_ID: z.string(),
    LOG_CHANNEL_ID: z.string(),
    GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().transform((val) => {
        try {
            return JSON.parse(val) as JWTInput;
        } catch {
            throw new Error(
                'Invalid JSON for GOOGLE_APPLICATION_CREDENTIALS_JSON'
            );
        }
    }),
    CHANNEL_TO_SHEET_ID_MAP: z.string().transform((val) => {
        try {
            return JSON.parse(val) as { [key: string]: string };
        } catch {
            throw new Error('Invalid JSON for CHANNEL_TO_SHEET_ID_MAP');
        }
    }),
});

type EnvironmentType = z.infer<typeof ENVIRONMENT_SCHEMA>;

let parsedEnvironment: EnvironmentType;

export const initialize = () => {
    dotenv.config();

    try {
        parsedEnvironment = ENVIRONMENT_SCHEMA.parse(process.env);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            throw new Error(JSON.stringify(error.issues, null, 2));
        } else if (error instanceof Error) {
            throw error;
        }
    }
};

export { parsedEnvironment as Environment };
