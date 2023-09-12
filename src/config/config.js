const config = {
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