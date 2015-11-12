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
