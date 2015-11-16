'use strict'

let utils = require('../utils')

class MySQL {
  /**
   * Connects to a MySQL/MariaDB database
   * returns a `Promise` to a `MySQL` instance
   */
  static open (opts) {
    let mysql = require('mysql')
    let dbname = opts.database
    opts.database = null
    let connection = mysql.createConnection(opts)
    return new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) return reject(err)
        else {
          let db = new MySQL(connection)
          if (dbname == null) {
            return resolve(db)
          } else {
            db.getOne(`SHOW DATABASES LIKE '${dbname}';`)
              .then((result) => {
                if (!result) {
                  db.isNew = true
                  return db.run(`CREATE SCHEMA ${dbname};`)
                }
              })
              .then(() => db.run(`USE ${dbname};`))
              .then(() => {
                resolve(db)
              })
          }
        }
      })
    })
  }

  /**
   * `MySQL` constructor
   * NOTE: Please use `MySQL.open()` instead
   */
  constructor (conn) {
    this.conn = conn

    this._getAll = utils.promisify(this.conn, 'query')
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
   * Runs a given query, returning a `Promise`
   * to the first returned row.
   */
  getOne (query) {
    return this.getAll(query).then(rows => rows[0])
  }

  /**
   * Runs a given query, returning a `Promise`
   * that is resolved once the query succeeds.
   */
  run (query) {
    return this.getAll(query).then(() => {})
  }

  /**
   * Runs `transact` in the context of a transaction
   * Returns a `Promise` to any single object promised by `transact`
   */
  transaction (transact) {
    return new Promise((resolve, reject) => {
      // Begin the transaction
      this.conn.beginTransaction((err) => {
        if (err) reject(err)
        else resolve(this)
      })
    })
    // Run `transact`
    .then(transact)
    // Try to commit the actions
    .then((o) => {
      return new Promise((resolve, reject) => {
        this.conn.commit((err) => {
          if (err) reject(err)
          else resolve(o)
        })
      })
    })
    // An error occurred - rollback
    .catch((err) => {
      return new Promise((resolve, reject) => {
        this.conn.rollback(() => {
          reject(err)
        })
      })
    })
  }

  /**
   * Closes the connection.
   * NOTE: If you do not call this, the mysql library
   * will still have events hanging around in the event
   * loop, and your app will not exit.
   */
  close () {
    return this.conn.end()
  }
}

module.exports = MySQL
