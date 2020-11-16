'use strict'

const Benchmark = require('benchmark')
const Agent11 = require('../')
const { Pool } = require('undici')

const suite = new Benchmark.Suite()
const agent = new Agent11({
  destroyTimeout: 1e9
})
const url = 'http://localhost:3000'
const pool = new Pool(url)

/* eslint-disable */
suite
  .add('Agent11.getConnection()', function getConnection() {
    const connection = agent.getConnection(url)
  })
  .add('Pool noop', function poolNoop() {
    const connection = pool
  })
  .on('cycle', event => console.log(String(event.target)))
  .on('complete', function onComplete() {
    pool.close().catch()
    agent.close().catch()
  })
  .run()
