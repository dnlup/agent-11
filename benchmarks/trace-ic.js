'use strict'

const Agent = require('../')

const options = {
  destroyTimeout: 1e3,
  connectionOptions: {
    pipelining: 1
  }
}

const agent = new Agent(options)

/* eslint-disable no-unused-vars */
for (let i = 0; i < 1000; i++) {
  let connection = agent.getConnection('http://localhost')
  connection = agent.getConnection('http://localhost', {
    socketPath: '/tmp/agent-11.sock'
  })
  const size = agent.size
}

for (let i = 0; i < 1000; i++) {
  let connection = agent.getConnection(`http://localhost:${i}`)
  connection = agent.getConnection(`http://localhost:${i}`, {
    socketPath: '/tmp/agent-11.sock'
  })
  const size = agent.size
}

let url = new URL('http://localhost')

for (let i = 0; i < 1000; i++) {
  let connection = agent.getConnection(url)
  connection = agent.getConnection(url, {
    socketPath: '/tmp/agent-11.sock'
  })
  const size = agent.size
}

for (let i = 0; i < 1000; i++) {
  url = {
    protocol: 'http',
    hostname: 'localhost',
    port: i
  }
  let connection = agent.getConnection(url)
  connection = agent.getConnection(url, {
    socketPath: '/tmp/agent-11.sock'
  })
  const size = agent.size
}

/* eslint-enable no-unused-vars */

setTimeout(() => agent.close(), 1000)
