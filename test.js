'use strict'

const { test } = require('tap')
const { promisify } = require('util')
const Agent = require('./')

const sleep = promisify(setTimeout)

test('invalid options', t => {
  const list = [
    {
      value: {
        destroyTimeout: 'string'
      },
      message: 'destroyTimeout must be a number > 0'
    },
    {
      value: {
        destroyTimeout: 0
      },
      message: 'destroyTimeout must be a number > 0'
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
    const error = t.throws(() => new Agent(item.value))
    t.is(error.message, item.message)
  }
  t.end()
})

test('getConnection with a URL or url like object', t => {
  const agent = new Agent()
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
  const agent = new Agent()
  t.teardown(() => agent.close())
  const url = 'http://xyz.xyz'
  const pool = agent.getConnection(url)
  t.is(pool, agent.getConnection(url))
  t.end()
})

test('getConnection should error if max hosts is reached', t => {
  const agent = new Agent({ maxHosts: 1 })
  t.teardown(() => agent.close())
  agent.getConnection(new URL('http://xyz1.xyz'))
  const error = t.throws(() => {
    agent.getConnection(new URL('http://xyz2.xyz'))
  })
  t.is('Maximum number of 1 hosts reached', error.message)
  t.end()
})

test('getConnection should error if the url is invalid', t => {
  const agent = new Agent()
  t.teardown(() => agent.close())
  let error = t.throws(() => agent.getConnection(null))
  t.is(error.message, 'Invalid url: \'null\'')
  error = t.throws(() => agent.getConnection(''))
  t.is(error.message, 'Invalid url: \'\'')
  error = t.throws(() => agent.getConnection({}))
  t.is(error.message, 'invalid protocol')
  t.end()
})

test('should terminate inactive connections', async (t) => {
  const agent = new Agent({ destroyTimeout: 200 })
  t.teardown(() => agent.close())
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  await sleep(300)
  t.is(0, agent.size)
})

test('shuld keep alive used connections', async (t) => {
  const agent = new Agent({ destroyTimeout: 200 })
  t.teardown(() => agent.close())
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  await sleep(100)
  t.is(1, agent.size)
  agent.getConnection(new URL('http://xyz.xyz'))
  await sleep(150)
  t.is(1, agent.size)
  t.end()
})

test('close', async (t) => {
  const agent = new Agent()
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  await agent.close()
  t.is(0, agent.size)
  t.end()
})

test('destroy', async (t) => {
  const agent = new Agent()
  agent.getConnection(new URL('http://xyz.xyz'))
  t.is(1, agent.size)
  await agent.destroy()
  t.is(0, agent.size)
  t.end()
})
