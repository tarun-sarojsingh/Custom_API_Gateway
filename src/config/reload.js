const express = require('express');
const { loadConfig } = require('./config');
const path = require('path');
const logger = require('./logger');
const adminAuthMiddleware = require('../middleware/adminAuth');

const reloadRouter = express.Router();
const CONFIG_PATH = path.resolve(process.cwd(), 'gateway.json');

reloadRouter.post('/admin/reload', adminAuthMiddleware, (req, res) => {
    logger.info('Admin triggered manual configuration reload');
    try {
        loadConfig(CONFIG_PATH);
        res.status(200).json({ message: 'Configuration reloaded successfully' });
    } catch (err) {
        logger.error({ err }, 'Failed to reload configuration via admin endpoint');
        res.status(500).json({ error: 'Failed to reload configuration' });
    }
});

module.exports = reloadRouter;
