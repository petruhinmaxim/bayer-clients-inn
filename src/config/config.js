const fs = require('fs')
const path = require('path')

const config = {
    db: {
        host: process.env.CNFT_DB_HOST,
        port: parseInt(process.env.CNFT_DB_PORT),
        user: process.env.CNFT_DB_USER,
        password: process.env.CNFT_DB_PASSWORD,
        database: process.env.CNFT_DB_DATABASE,
        max: parseInt(process.env.CNFT_DB_MAX_CONN),
    },
    telegram: {
        mainToken: process.env.CNFT_TELEGRAM_MAIN_TOKEN,
        adminToken: process.env.CNFT_TELEGRAM_ADMIN_TOKEN
    }
}

function buildConfig() {
    let hasLocal = true
    const localConfigModule = './local-config.js'
    try {
        require.resolve(localConfigModule)
    } catch (e) {
        hasLocal = false
    }
    if (hasLocal) {
        return require(localConfigModule)
    } else {
        return config
    }
}

module.exports = buildConfig()