/* eslint-disable no-console */
'use strict'

const React = require('react')
const Uploader = require('./Uploader')
const AlgorandTokenizer = require('./AlgorandTokenizer')
const Browser = require('./Browser')

import { Alignment, Button, Navbar, Divider } from "@blueprintjs/core"

//Get id of metadata payload from uploader and send to tokenizer

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      file_hash: "XYZ"
    }

    this.setFileHash = this.setFileHash.bind(this)
  }


  setFileHash(name) {
    this.setState({file_hash:name})
  }

  render () {
      //<Uploader onUploaded={this.setFileHash} >  </Uploader>
       //     <Divider /> 
        //<AlgorandTokenizer file_hash={this.state.file_hash}/>

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
        <Browser /> 
      </div>
    )
  }
}
module.exports = App
