/* eslint-disable no-console */
'use strict'

const React = require('react')
const ipfsClient = require('ipfs-http-client')
const Uploader = require('./Uploader')
const AlgorandTokenizer = require('./AlgorandTokenizer')

import { Alignment, Button, Navbar } from "@blueprintjs/core"


class App extends React.Component {
  constructor () {
    super()
  }

  render () {
    return (
      <div >
        <Navbar >
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading> Rare AF</Navbar.Heading>
            <Navbar.Divider />
            <Button className='bp3-minimal' icon='grid-view' text='Browse' />
            <Button className='bp3-minimal' icon='new-object' text='Create' />
          </Navbar.Group >
        </Navbar>
        <div class='container'>
          <Uploader />
        </div>
        <div class='container'>
          <AlgorandTokenizer />
        </div>
      </div>
    )
  }
}
module.exports = App
