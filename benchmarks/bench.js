'use strict'

const Benchmark = require('benchmark')
const Agent11 = require('../')

const suite = new Benchmark.Suite()
const agent = new Agent11({
  destroyTimeout: 1e9
})
const urlString = 'http://localhost:3000/'
const urlObject = new URL('http://localhost:3000')

/* eslint-disable */
suite
  .add('Agent11.getConnection(<string>)', function getConnectionFromString() {
    const connection = agent.getConnection(urlString)
  })
  .add('Agent11.getConnection(<object>)', function getConnectionFromObject() {
    const connection = agent.getConnection(urlObject)
  })
  .on('cycle', event => console.log(String(event.target)))
  .on('complete', function onComplete() {
    agent.close().catch()
  })
  .run()
