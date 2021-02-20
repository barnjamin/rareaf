/* eslint-disable no-console */
'use strict'

const React = require('react')
const ipfsClient = require('ipfs-http-client')
const Uploader = require('./Uploader')
const AlgorandTokenizer = require('./AlgorandTokenizer')

class App extends React.Component {
  constructor () {
    super()
  }
  render () {
    return (
      <div>
        <Uploader />
        <AlgorandTokenizer />
      </div>
    )
  }
}
module.exports = App
