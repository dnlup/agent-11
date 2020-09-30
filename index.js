'use strict'

const { Pool } = require('undici')

const {
  kHostsMap,
  kDestroyTimeout,
  kMaxHosts,
  kPoolOptions,
  kSetupConnection,
  kRemove,
  kRefresh,
  kStore,
  kTimersMap,
  kGetKey
} = require('./symbols')

const noop = () => {}

function onTimeout (pool, client, key) {
  client[kHostsMap].delete(key)
  client[kTimersMap].delete(pool)
  pool.close(noop)
}

class Agent {
  constructor ({
    destroyTimeout = 6e4,
    maxHosts = 100,
    ...poolOptions
  } = {}) {
    if (typeof destroyTimeout !== 'number' || destroyTimeout <= 0) {
      throw new Error(
        'destroyTimeout must be a number > 0'
      )
    }
    if (typeof maxHosts !== 'number' || maxHosts <= 0) {
      throw new Error('maxHosts must be a number > 0')
    }
    this[kHostsMap] = new Map()
    this[kDestroyTimeout] = destroyTimeout
    this[kMaxHosts] = maxHosts
    this[kPoolOptions] = poolOptions
    this[kTimersMap] = new Map()
  }

  [kSetupConnection] (url) {
    if (this.size === this[kMaxHosts]) {
      throw new Error(
                `Maximum number of ${this[kMaxHosts]} hosts reached`
      )
    }
    return new Pool(url, this[kPoolOptions])
  }

  [kRefresh] (pool) {
    const timer = this[kTimersMap].get(pool)
    timer.refresh()
  }

  [kStore] (key, pool) {
    this[kHostsMap].set(key, pool)
    this[kTimersMap].set(
      pool,
      setTimeout(onTimeout, this[kDestroyTimeout], pool, this, key)
    )
  }

  [kRemove] (key, pool) {
    this[kHostsMap].delete(key)
    clearTimeout(this[kTimersMap].get(pool))
    this[kTimersMap].delete(pool)
  }

  get size () {
    return this[kHostsMap].size
  }

  [kGetKey] (url) {
    let key
    if (typeof url === 'string') {
      key = url
    } else if (typeof url === 'object' && url !== null) {
      if (url instanceof URL) {
        key = url.origin
      } else {
        let protocol = url.protocol || ''
        if (!protocol.endsWith(':')) {
          protocol = `${protocol}:`
        }
        key = url.port ? `${protocol}//${url.hostname}:${url.port}` : `${protocol}//${url.hostname}`
      }
    }
    if (!key || typeof key !== 'string') {
      throw new Error(`Invalid url: '${url}'`)
    }
    return key
  }

  getConnection (url) {
    const key = this[kGetKey](url)
    if (this[kHostsMap].has(key)) {
      const pool = this[kHostsMap].get(key)
      this[kRefresh](pool)
      return pool
    } else {
      const pool = this[kSetupConnection](url)
      this[kStore](key, pool)
      return pool
    }
  }

  close () {
    const closing = []
    for (const [key, pool] of this[kHostsMap]) {
      closing.push(pool.close())
      this[kRemove](key, pool)
    }
    return Promise.all(closing)
  }

  destroy (err) {
    const closing = []
    for (const [key, pool] of this[kHostsMap]) {
      closing.push(pool.destroy(err))
      this[kRemove](key, pool)
    }
    return Promise.all(closing)
  }
}

module.exports = Agent
