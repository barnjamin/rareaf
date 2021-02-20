/* eslint-disable no-console */
'use strict'

const React = require('react')
const ipfsClient = require('ipfs-http-client')
const Uploader = require('./Uploader')

class App extends React.Component {
  constructor () {
    super()
  }
  render () {
    return (
      <Uploader />
    )
  }
}
module.exports = App
