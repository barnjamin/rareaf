/* eslint-disable no-console */
'use strict'

const React = require('react')
const Uploader = require('./Uploader')
const AlgorandTokenizer = require('./AlgorandTokenizer')
const Browser = require('./Browser')

import RAF from './RAF'

import {
  BrowserRouter as Router,
  Route,
  Switch
} from "react-router-dom";


import { Alignment, AnchorButton, Navbar, Divider } from "@blueprintjs/core"

//Get id of metadata payload from uploader and send to tokenizer

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      file_hash: "XYZ"
    }
    this.setFileHash = this.setFileHash.bind(this)
  }


  setFileHash(name) {
    this.setState({ file_hash: name })
  }

  render() {

    return (
      <Router>
        <Navbar >
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading> Rare AF</Navbar.Heading>
            <Navbar.Divider />
            <AnchorButton className='bp3-minimal' icon='grid-view' text='Browse' href="/" />
            <AnchorButton className='bp3-minimal' icon='new-object' text='Create' href="/create" />
          </Navbar.Group >
        </Navbar>
        <Switch>
          <Route exact path="/" >
            <Browser />
          </Route>
          <Route path="/create" >
            <Uploader onUploaded={this.setFileHash} >  </Uploader>
            <Divider />
            <AlgorandTokenizer file_hash={this.state.file_hash} />
          </Route>
          <Route path="/raf/:id" children={<RAF />}>
          </Route>
        </Switch>
      </Router>
    )
  }
}
module.exports = App
