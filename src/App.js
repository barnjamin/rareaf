/* eslint-disable no-console */
'use strict'

import $ from 'jquery'
import React from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch
} from "react-router-dom";
import { Alignment, AnchorButton, Navbar, Divider } from "@blueprintjs/core"

import {isAlgorandWalletConnected} from './algorand'

import Uploader from './Uploader'
import AlgorandTokenizer from './AlgorandTokenizer'
import Browser  from './Browser'
import AlgorandWalletConnector from './AlgorandWalletConnector'
import RAF from './RAF'
//import Canvas from './Canvas'


class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = { 
      file_hash: undefined ,
      wallet_connected: false 
    }
    this.setFileHash = this.setFileHash.bind(this)

    this.setConnected = this.setConnected.bind(this)

    isAlgorandWalletConnected().then((c)=>{this.setState({wallet_connected:c})})
  }


  setConnected() {

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
          <Navbar.Group align={Alignment.RIGHT}>
            <AlgorandWalletConnector onConnected={this.setConnected} connected={this.state.wallet_connected}/>
          </Navbar.Group>
        </Navbar>
        <Switch>
          <Route exact path="/" >
            <Browser />
          </Route>
          <Route path="/create" >
            <Uploader onUploaded={this.setFileHash} file_hash={this.state.file_hash}>  </Uploader>
            <Divider />
            <AlgorandTokenizer file_hash={this.state.file_hash} />
          </Route>
          <Route path="/raf/:id" children={<RAF />}>
          </Route>
        </Switch>
      </Router>
    )

          //<AnchorButton className='bp3-minimal' icon='draw' text='Draw' href="/draw" />
          //<Route path="/draw">
          //  <Canvas></Canvas>
          //  <Divider />
          //  <AlgorandTokenizer file_hash={this.state.file_hash} />
          //</Route>
  }
}
module.exports = App
