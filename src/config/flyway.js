// Inspired by:
// https://github.com/markgardner/node-flywaydb/blob/HEAD/sample/config.js

const path = require('path')
const config = require('./config.js')

module.exports = function() {
    const sslParams = !config.db.ssl ? '' : `?ssl=true&sslmode=verify-ca` +
      `&sslrootcert=${__dirname}${path.sep}catchnft_pg_cert${path.sep}root.crt` +
      `&sslcert=${__dirname}${path.sep}catchnft_pg_cert${path.sep}client.crt` +
      `&sslkey=${__dirname}${path.sep}catchnft_pg_cert${path.sep}client.pk8`
    let url = `jdbc:postgresql://${config.db.host}:${config.db.port}/${config.db.database}${sslParams}`
    let password = config.db.password
    if (process.platform === 'win32') {
        url =`"${url}"`
        password = `"${password}"`
    }
    return {
        flywayArgs: {
            url,
            schemas: 'public',
            locations: 'filesystem:src/db/migrations',
            user: config.db.user,
            password,
            sqlMigrationSuffixes: '.sql',
            baselineVersion: '0.0',
            baselineDescription: 'init',
            baselineOnMigrate: true
        },
        version: '8.5.10',
        downloads: {
            storageDirectory: 'flyway', // optional, the specific directory to store the flyway downloaded files. The directory must be writable by the node app process' user.
            expirationTimeInMs: -1, // optional, -1 will never check for updates, defaults to 1 day.
        }
    }
}
