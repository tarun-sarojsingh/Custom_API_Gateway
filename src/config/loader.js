const chokidar = require('chokidar');
const path = require('path');
const { loadConfig } = require('./config');
const logger = require('./logger');

const CONFIG_PATH = path.resolve(process.cwd(), 'gateway.json'); // or gateway.yml if preferred

function initConfigWatcher() {
    // Initial load
    loadConfig(CONFIG_PATH);

    // Watch for changes
    const watcher = chokidar.watch(CONFIG_PATH, {
        persistent: true,
        awaitWriteFinish: true,
    });

    watcher.on('change', (path) => {
        logger.info(`[Config] Change detected in ${path}. Reloading configuration...`);
        loadConfig(CONFIG_PATH);
    });

    watcher.on('error', (error) => {
        logger.error(`[Config] Watcher error: ${error}`);
    });
}

module.exports = {
    initConfigWatcher,
};
