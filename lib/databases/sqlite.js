'use strict'

let utils = require('../utils')

class SQLite {
  /**
   * Opens an sqlite3 database from a given file
   * returns a `Promise` to an `SQLite` instance
   */
  static open (fname, opts) {
    let sqlite = require('sqlite3')
    // Only try to require transactions if they're enabled
    let TransactDB = opts.transactions
      ? require('sqlite3-transactions').TransactionDatabase
      : null

    return new Promise((resolve, reject) => {
      // Try to load the database
      let db = new sqlite.Database(fname, (err) => { if (err) reject(err) })
      db.on('open', () => { resolve(new SQLite(db, !!opts.transactions)) })
      // If transactions are enabled, wrap db in a TransactDB
      if (TransactDB) {
        db = new TransactDB(db)
      }
    })
  }

  /**
   * `SQLite` constructor
   * NOTE: Please use `SQLite.open()` instead
   */
  constructor (db, allowTransact) {
    this.db = db

    this._run = utils.promisify(db, 'run')
    this._getOne = utils.promisify(db, 'get')
    this._getAll = utils.promisify(db, 'all')
    if (allowTransact) {
      this._trnStart = utils.promisify(db, 'beginTransaction')
      this._trnCommit = utils.promisify(db, 'commit')
    }
  }

  /**
   * Runs a given query, returning a `Promise`
   * that is resolved once the query succeeds.
   */
  run (query) {
    if (typeof query === 'string') {
      return this._run(query)
    } else {
      return this._run(query.text, query.values)
    }
  }

  /**
   * Runs a given query, returning a `Promise`
   * to the first returned row.
   */
  getOne (query) {
    if (typeof query === 'string') {
      return this._getOne(query)
    } else {
      return this._getOne(query.text, query.values)
    }
  }

  /**
   * Runs a given query, returning a `Promise`
   * to an `Array` of all returned rows.
   */
  getAll (query) {
    if (typeof query === 'string') {
      return this._getAll(query)
    } else {
      return this._getAll(query.text, query.values)
    }
  }

  /**
   * Runs `transact` in the context of a transaction.
   * NOTE: you must provide `transactions: true` to
   * `SQLite.open()`, otherwise this method will throw
   * a TypeError.
   */
  transaction (transact) {
    if (this._trnStart == null) {
      throw new TypeError('Transactions are not enabled for this database')
    }
    return this._trnStart().then((tdb) => {
      // Transaction has started
      // Run `transact` with the new context
      return transact(new SQLite(tdb))
      // Ensure that a rollback occurs if there are any errors
      .catch((err) => {
        return new Promise((resolve, reject) => {
          tdb.rollback(() => { reject(err) })
        })
      })
      // Commit the transaction
      .then((o) => {
        return this._trnCommit().then(() => o)
      })
    })
  }
}

module.exports = SQLite
