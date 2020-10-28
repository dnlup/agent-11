'use strict'

const { test } = require('tap')
const FakeTimers = require('@sinonjs/fake-timers')
const Agent11 = require('./')
const { kGetKey } = require('./symbols')

test('invalid options', t => {
  const list = [
    {
      value: {
        closeTimeout: 'string'
      },
      message: 'closeTimeout must be a number > 0'
    },
    {
      value: {
        closeTimeout: 0
      },
      message: 'closeTimeout must be a number > 0'
    },
    {
      value: {
        maxHosts: '1'
      },
      message: 'maxHosts must be a number > 0'
    },
    {
      value: {
        maxHosts: 0
      },
      message: 'maxHosts must be a number > 0'
    }
  ]
  for (const item of list) {
    const error = t.throws(() => new Agent11(item.value))
    t.is(error.message, item.message)
  }
  t.end()
})

test('kGetKey from url and options', t => {
  const list = [
    {
      opts: [
        new URL('http://localhost:3333')
      ],
      expected: 'http:localhost:3333'
    },
    {
      opts: [
        { hostname: 'localhost' }
      ],
      expected: 'http:localhost'
    },
    {
      opts: [
        {
          protocol: 'http',
          hostname: 'localhost'
        }
      ],
      expected: 'http:localhost'
    },
    {
      opts: [
        new URL('https://localhost:3400'),
        {
          socketPath: '/tmp/agent-11/agent.sock'
        }
      ],
      expected: 'https:localhost:3400:/tmp/agent-11/agent.sock'
    }
  ]

  const agent = new Agent11()

  for (const [index, item] of list.entries()) {
    const key = agent[kGetKey](...item.opts)
    t.is(key, item.expected, `list item ${index}`)
  }
  t.end()
})

test('getConnection with a URL or url like object', t => {
  const agent = new Agent11()
  t.teardown(() => agent.close())
  const url = new URL('http://xyz.xyz:2222')
  const p1 = agent.getConnection(url)
  t.is(p1, agent.getConnection(url))
  const urlLike = {
    protocol: 'http',
    hostname: 'example.undici.com',
    port: 3000
  }
  const p2 = agent.getConnection(urlLike)
  t.is(p2, agent.getConnection(urlLike))
  t.is(true, p1 !== p2)
  t.end()
})

test('getConnection with a string', t => {
  const agent = new Agent11()
  t.teardown(() => agent.close())
  const url = 'http://xyz.xyz'
  const pool = agent.getConnection(url)
  t.is(pool, agent.getConnection(url))
  t.end()
})

test('getConnection with a unix socket', t => {
  const agent = new Agent11()
  t.teardown(() => agent.close())
  const url = 'http://xyz.xyz'
  const socketPath = '/tmp/agent-11/agent.sock'
  const pool = agent.getConnection(url, {
    socketPath
  })
  t.is(pool, agent.getConnection(url, {
    socketPath
  }))
  t.end()
})

test('getConnection should error if max hosts is reached', t => {
  const agent = new Agent11({ maxHosts: 1 })
  t.teardown(() => agent.close())
  agent.getConnection(new URL('http://xyz1.xyz'))
  const error = t.throws(() => {
    agent.getConnection(new URL('http://xyz2.xyz'))
  })
  t.is('Maximum number of 1 hosts reached', error.message)
  t.end()
})

test('getConnection should error if the url is invalid', t => {
  const agent = new Agent11()
  t.teardown(() => agent.close())
  let error = t.throws(() => agent.getConnection(null))
  t.is(error.message, 'Can\'t get key from url: \'null\'')
  error = t.throws(() => agent.getConnection(''))
  t.is(error.message, 'Invalid URL: ')
  error = t.throws(() => agent.getConnection({}))
  t.is(error.message, 'invalid protocol')
  t.end()
})

test('should terminate inactive connections', t => {
  const clock = FakeTimers.install()
  const agent = new Agent11({ closeTimeout: 200 })
  t.teardown(() => {
    agent.close()
    clock.uninstall()
  })
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  clock.tick(300)
  t.is(0, agent.size)
  t.end()
})

test('shuld keep alive used connections', t => {
  const clock = FakeTimers.install()
  const agent = new Agent11({ closeTimeout: 200 })
  t.teardown(() => {
    agent.close()
    clock.uninstall()
  })
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  clock.tick(100)
  t.is(agent.size, 1)
  agent.getConnection(new URL('http://xyz.xyz'))
  clock.tick(150)
  t.is(agent.size, 1)
  t.end()
})

test('close', async (t) => {
  const agent = new Agent11()
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  await agent.close()
  t.is(0, agent.size)
  t.end()
})

test('destroy', async (t) => {
  const agent = new Agent11()
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  await agent.destroy()
  t.is(0, agent.size)
  t.end()
})
