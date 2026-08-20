const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

let configData = {};

function loadConfig(configPath) {
    try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const parsed = yaml.parse(fileContents) || {};
        // Set defaults
        configData = {
            server: {
                port: parsed.server?.port || 8080,
            },
            redis: {
                address: parsed.redis?.address || 'localhost:6379',
                password: parsed.redis?.password || '',
            },
            global_rate_limit: {
                requests_per_second: parsed.global_rate_limit?.requests_per_second || 100,
                burst: parsed.global_rate_limit?.burst || 20,
            },
            clusters: parsed.clusters || [],
            routes: parsed.routes || [],
        };
        console.log(`[Config] Loaded config from ${configPath}`);
    } catch (err) {
        console.error(`[Config] Error loading config: ${err.message}`);
    }
}

function getConfig() {
    return configData;
}

module.exports = {
    loadConfig,
    getConfig,
};
