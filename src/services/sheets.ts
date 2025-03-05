import { google } from 'googleapis';

import { Environment } from './environment.js';

const sheets = google.sheets({
    version: 'v4',
    auth: new google.auth.GoogleAuth({
        credentials: Environment.GOOGLE_APPLICATION_CREDENTIALS_JSON,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    }),
});

export default sheets;
