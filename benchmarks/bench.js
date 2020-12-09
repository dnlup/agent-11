'use strict'

const Benchmark = require('benchmark')
const Agent11 = require('../')

const suite = new Benchmark.Suite()
const agent = new Agent11({
  destroyTimeout: 1e9
})
const urlString = 'http://localhost:3000/some/path'
const urlObject = {
  protocol: 'http:',
  hostname: 'localhost',
  port: 3000,
  pathname: '/some/path'
}
const url = new URL('http://localhost:3000/some/path')

// setup the connection first
agent.getConnection(urlString)

/* eslint-disable */
suite
  .add('Agent11.getConnection(<string>)', function getConnectionFromString() {
    const connection = agent.getConnection(urlString)
  })
  .add('Agent11.getConnection(<object>)', function getConnectionFromObject() {
    const connection = agent.getConnection(urlObject)
  })
  .add('Agent11.getConnection(<URL>)', function getConnectionFromObject() {
    const connection = agent.getConnection(url)
  })
  .on('cycle', event => console.log(String(event.target)))
  .on('complete', function onComplete() {
    agent.close().catch()
  })
  .run()
