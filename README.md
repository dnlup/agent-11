# agent-11
[![npm version](https://badge.fury.io/js/%40dnlup%2Fagent-11.svg)](https://badge.fury.io/js/%40dnlup%2Fagent-11)
![Tests](https://github.com/dnlup/agent-11/workflows/Tests/badge.svg)
[![codecov](https://codecov.io/gh/dnlup/agent-11/branch/next/graph/badge.svg?token=GW9FKJPL5L)](https://codecov.io/gh/dnlup/agent-11)
[![Known Vulnerabilities](https://snyk.io/test/github/dnlup/agent-11/badge.svg?targetFile=package.json)](https://snyk.io/test/github/dnlup/agent-11?targetFile=package.json)

> A simple pool manager for [`undici`](https://github.com/nodejs/undici).

You might find this module useful if you are using [`undici`](https://github.com/nodejs/undici) and need to manage connections to different and unknown hosts.

`agent-11` controls [`undici`'s](https://github.com/nodejs/undici) pool connections to different hosts. Each time you request a new one, it creates a new pool.
If you don't request this connection after a certain amount of time, `agent-11` will close it.

<!-- toc -->

- [Installation](#installation)
    + [Requirements](#requirements)
    + [latest stable version](#latest-stable-version)
    + [latest development version](#latest-development-version)
- [Usage](#usage)
- [API](#api)
  * [Class: `Agent11`](#class-agent11)
    + [new `Agent11([options])`](#new-agent11options)
    + [`agent.getConnection(url, [options])`](#agentgetconnectionurl-options)
    + [`agent.close()`](#agentclose)
    + [`agent.destroy([error])`](#agentdestroyerror)
- [Contributing](#contributing)

<!-- tocstop -->

## Installation

#### Requirements

`agent-11` requires that you already have installed `undici` in your project.

#### latest stable version

```bash
$ npm i @dnlup/agent-11
```

#### latest development version

```bash
$ npm i @dnlup/agent-11@next
```

## Usage

```js
const Agent11 = require('@dnlup/agent-11')

const agent = new Agent11({
  closeTimeout: 6e5, // inactive connections will be closed after 600000 millieconds 
  connectionOptions: {
    pipelining: 10
  }
}

const conn1 = agent.getConnection('http://localhost:3000') // use conn1 to make requests with undici API

const conn2 = agent.getConnection(new URL('http://localhost:4000', {
  socketPath: '/tmp/agent-11.sock' // these options are merged with the default `connectionOptions` passed when creating the agent
})

// close all the agent connections
agent.close().then().catch(console.error)

// destroy all the agent connections
agent.destroy(new Error('no more!')).then().catch(console.error)
```
## API

> The module directly exports a [`Agent11`](#class-agent11) class, which is the connections manager.

### Class: `Agent11`

It manages `undici`'s pool connections.

#### new `Agent11([options])`

* `options` `<Object>`
  * `closeTimeout` `<number>`: the time (in milliseconds) of inactivity, after which it will close a connection. **Default:** `60000`.
  * `maxHosts` `<number>`: the maximum number of connections to different hosts. **Default:** `Infinity` .
  * `connectionOptions`: the default options to use to create a new connection. See [undici documentation](https://github.com/nodejs/undici#new-undiciclienturl-opts).

#### `agent.getConnection(url, [options])`

* `url` `<string|URL|Object>`: the url to connect to.
* `options` `<Object>`: the connection options.
* Returns: [`Pool`](https://github.com/nodejs/undici#new-undicipoolurl-opts)

The parameters are the same ones as [`undici`](https://github.com/nodejs/undici#new-undiciclienturl-opts). It will merge the `options` object with the `connectionOptions` specified when creating the class instance.
It returns a `Pool` instance connected to the given `url` and `options`.

#### `agent.close()`

* Returns: `<Promise>`

It closes all the `Pool` connections gracefully.

#### `agent.destroy([error])`

* `error` `<Error>`: the error to emit when destroying the connections.
* Returns: `<Promise>`

It destroys all the `Pool` connections. It optionally takes an error parameter.

## Contributing

You found a bug or want to discuss and implement a new feature? This project welcomes contributions.

The code follows the [standardjs](https://standardjs.com/) style guide.

Every contribution should pass the existing tests or implementing new ones if that's the case.

```bash
# Run tests
$ npm test

# Lint the code
$ npm lint

# Create the TOC in the README
$ npm run doc
```
