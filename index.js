'use strict'

const { Pool } = require('undici')

const {
  kHostsMap,
  kCloseTimeout,
  kMaxHosts,
  kDefaultConnectionOptions,
  kSetupConnection,
  kRemove,
  kClose,
  kRefresh,
  kStore,
  kTimersMap,
  kGetKey,
  kGetKeyFromString,
  kGetKeyFromObject
} = require('./symbols')

const noop = () => {}
const URL_REG = /^(http[s]*:)?\/?\/?([^:/]+):?([0-9]+)?/

function onTimeout (key, pool, client) {
  client[kRemove](key, pool)
  pool.close(noop)
}

class Agent11 {
  constructor ({
    closeTimeout = 6e4,
    maxHosts = Infinity,
    connectionOptions = {}
  } = {}) {
    if (typeof closeTimeout !== 'number' || closeTimeout <= 0) {
      throw new Error(
        'closeTimeout must be a number > 0'
      )
    }
    if (typeof maxHosts !== 'number' || maxHosts <= 0) {
      throw new Error('maxHosts must be a number > 0')
    }
    this[kHostsMap] = new Map()
    this[kCloseTimeout] = closeTimeout
    this[kMaxHosts] = maxHosts
    this[kDefaultConnectionOptions] = connectionOptions
    this[kTimersMap] = new Map()
  }

  [kSetupConnection] (url, options) {
    if (this.size === this[kMaxHosts]) {
      throw new Error(`Maximum number of ${this[kMaxHosts]} hosts reached`)
    }
    return new Pool(url, Object.assign({}, this[kDefaultConnectionOptions], options))
  }

  [kRefresh] (pool) {
    const timer = this[kTimersMap].get(pool)
    timer.refresh()
  }

  [kStore] (key, pool) {
    this[kHostsMap].set(key, pool)
    this[kTimersMap].set(
      pool,
      setTimeout(onTimeout, this[kCloseTimeout], key, pool, this)
    )
  }

  [kRemove] (key, pool) {
    this[kHostsMap].delete(key)
    this[kTimersMap].delete(pool)
  }

  [kClose] (key, pool) {
    clearTimeout(this[kTimersMap].get(pool))
    this[kRemove](key, pool)
  }

  get size () {
    return this[kHostsMap].size
  }

  [kGetKeyFromString] (url) {
    const match = URL_REG.exec(url)
    return this[kGetKeyFromObject]({
      protocol: match && match[1],
      hostname: match && match[2],
      port: match && match[3]
    })
  }

  [kGetKeyFromObject] (url) {
    let key = url.protocol || 'http:'
    if (key.charAt(key.length - 1) !== ':') {
      key += ':'
    }
    key += url.hostname
    if (typeof url.port === 'string' || typeof url.port === 'number') {
      key += ':'
      key += url.port
    }
    return key
  }

  [kGetKey] (url, options) {
    let key = ''
    if (typeof url === 'string') {
      key = this[kGetKeyFromString](url)
    } else if (typeof url === 'object' && url !== null) {
      key = this[kGetKeyFromObject](url)
    } else {
      throw new TypeError(`Can't get key from url: '${url}'`)
    }
    if (options && options.socketPath) {
      key += ':'
      key += options.socketPath
    }
    return key
  }

  getConnection (url, options) {
    const key = this[kGetKey](url, options)
    if (this[kHostsMap].has(key)) {
      const pool = this[kHostsMap].get(key)
      this[kRefresh](pool)
      return pool
    } else {
      const pool = this[kSetupConnection](url, options)
      this[kStore](key, pool)
      return pool
    }
  }

  close () {
    const closing = []
    for (const [key, pool] of this[kHostsMap]) {
      closing.push(pool.close())
      this[kClose](key, pool)
    }
    return Promise.all(closing)
  }

  destroy (err) {
    const closing = []
    for (const [key, pool] of this[kHostsMap]) {
      closing.push(pool.destroy(err))
      this[kClose](key, pool)
    }
    return Promise.all(closing)
  }
}

module.exports = Agent11
