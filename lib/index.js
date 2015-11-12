'use strict'

/**
 * Opens a database from a given URL
 * Detects the database type from the protocol part
 * Throws an `Error` if an unsupported protocol is passed
 */
function open (url, opts) {
  if (url.startsWith('sqlite:')) {
    // Trying to load an SQLite database from a path
    // URL scheme: `sqlite:/path/to/database.db` or `sqlite::memory:`
    let fname = url.match(/^sqlite:(.+)/)[1]
    return dbapi.SQLite.open(fname, opts || {})
  } else if (url.startsWith('mysql:') || url.startsWith('mariadb:')) {
    // Trying to load a MySQL/MariaDB database
    // URL scheme: `mysql://host:port/db` or `mysql://host/db`
    // Also `mariadb://...`
    let parts = url.match(/^(mysql|mariadb):\/\/([a-zA-Z0-9\-.]+)(:[0-9]+)?(\/.+)?/)
    // Set opts from URL parts
    opts.host = parts[2]
    opts.port = parts[3]
      ? parseInt(parts[3].substring(1, parts[3].length), 10)
      : 3306
    opts.database = parts[4]
      ? parts[4].substring(1, parts[4].length)
      : null
    return dbapi.MySQL.open(opts)
  } else {
    throw new Error(`Protocol "${url.match(/^(.*):/)[1]}" is not supported`)
  }
}

// The `open()` function is the module itself, but also a part of the module
// i.e. it can be called either as `require('dbapi')()`
// or as `require('dbapi').open()`
let dbapi = open
dbapi.open = open
module.exports = dbapi

// Add in other databases
dbapi.SQLite = require('./databases/sqlite')
dbapi.MySQL = require('./databases/mysql')
