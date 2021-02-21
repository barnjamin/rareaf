/* eslint-disable no-console */
'use strict'

const React = require('react')
const Uploader = require('./Uploader')
const AlgorandTokenizer = require('./AlgorandTokenizer')

import { Alignment, Button, Navbar, Divider } from "@blueprintjs/core"

//Get id of metadata payload from uploader and send to tokenizer

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
        <Uploader />
        <Divider />
        <AlgorandTokenizer />
        <Divider />
        <div className='container-mint'>
          <Button onClick={this.createToken} rightIcon='clean' >Mint</Button>
        </div>
      </div>
    )
  }
}
module.exports = App
