import * as environment from './services/environment.js';
import * as discord from './discordClient.js';

(async () => {
    environment.initialize();
    await discord.initialize();
})();
