# API Docs #

dbapi was heavily inspired by the `sqlite3` module's API. I really liked how
it was simple and exposed a sensible API.

dbapi isn't exclusive to SQLite, nor to SQL. We hope to build up support for
as many commonly used databases as reasonable.


## dbapi ##

The main export of dbapi is the `open()` function (which is also referred to
as the `dbapi` object). If you prefer a bit more clarity, the `open()` function
is aliased onto itself, so rather than `require('dbapi')()`, you can
`require('dbapi').open()`.

The `dbapi` object also contains the individual database classes, but you'll
probably rarely use these directly.


### `dbapi.open(url: String, opts: Object): Promise<DB>` ###

Opens a database based on `url`. `opts` is passed directly to the database
connection function (where relevant), so you can use it where necessary to
add connection info.

Returns a promise to an object conforming to the `DB` interface, as specified
below.

URLs should take the formats:

- **SQLite**: `sqlite:<path>`
    - e.g. `sqlite:data.db`
    - e.g. `sqlite::memory:`
- **MySQL/MariaDB**: `mysql://<host>[:port]/<db>` or `mariadb://<host>[:port]/<db>`
    - e.g. `mysql://localhost:3316/mydb`
    - e.g. `mariadb://maria/mydb` (assuming `maria` is in your hosts file, e.g. in a docker setup)


### `DB` Interface ###

#### `db.run(query: ?): Promise<null>` ####

Runs `query` on the database, fulfilling the promise on success. Any resulting
rows are thrown away.

`query` might take different forms, depending on the database you are using.

- SQL: A `String` containing valid SQL, or an `Object` mimicking an `sql`
    module query (`{ text: (the query), values: (values for SQL parameters) }`)


#### `db.getOne(query: ?): Promise<?>` ####

Runs `query` (see `db.run()` for format), resolving the promise with the first
result. For SQL databases, this result is an `Object`, with keys being column
names.


#### `db.getAll(query: ?): Promise<Array<?>>` ####

Runs `query` (se `db.run()` for format), resolving the promise with an array of
the results. Each result follows the format seen in `db.getOne()`.


#### `db.transaction(actions: (db: DB): Promise<?>): Promise<?>` ####

Starts a database transaction, and performs the `actions`. When within a
transaction, use the `db` passed to `actions` rather than the main `db` object.

`actions` must return a `Promise`. Once this promise is fulfilled, the actions
will be committed. If the promise is rejected, a rollback will be made and the
rejection will be passed on to the promise returned from `db.transaction()`.

The `Promise` returned from `db.transaction()`, if the `actions` were
successful, resolves to the same object as the `Promise` returned from
`actions`.


### Pooled Connections ###

If a database library supports it, you may use pooled connections. To do this,
pass `pooling: true` in the `.open()` options.


#### `pooledDB.connect(actions: (db: DB): Promise<?>): Promise<?>` ####

Retrieves a database connection from the pool, and performs the `actions`. Use
the `db` passed to `actions` - this represents the active connection.

`actions` must return a `Promise`. Once this promise is resolved or rejected,
the connection will be released back to the pool.

The `Promise` returned from `.connect()`, if the `actions` were successful,
resolves to the same object as the `Promise` returned from `actions`. If the
promise is rejected, the rejection will be passed on to the promise returned
from `.connect()`.


### Database Quirks ###

Some databases might act a bit different.


#### SQLite ####

In order to use `db.transaction()`, you must set `transactions: true` in `opts`
passed to `.open()` (e.g. `open('sqlite::memory:', { transactions: true })`).
Otherwise, a `TypeError` will be _thrown_ when trying to use
`db.transaction()`. You must also `npm install sqlite3-transactions`. If the
`sqlite3` maintainers decide to add transaction functionality directly into the
`sqlite3` module, this requirement will be lifted.


#### MySQL ####

You must pass the database username and password via the options passed to
`.open()`. You cannot put them in the URL.

After some inactivity, the connection may be terminated. To avoid breaking your
app, you may prefer to use pooled connections (which is probably a good idea
anyway).
