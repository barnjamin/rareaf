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

import Uploader from './Uploader'
import AlgorandTokenizer from './AlgorandTokenizer'
import Browser  from './Browser'
import AlgorandWalletConnector from './AlgorandWalletConnector'
import RAF from './RAF.js'
import Listing from './Listing.js'


class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = { 
      cid: undefined, 
      wallet: undefined
    }

    this.setCID = this.setCID.bind(this)

    this.setWallet = this.setWallet.bind(this)
    this.walletConnected = this.walletConnected.bind(this)
  }

  walletConnected(){
    return (this.state.wallet !== undefined && this.state.wallet.isConnected())
  }

  setWallet(wallet) {
    this.setState({wallet:wallet})
  }

  setCID(cid) { this.setState({ cid: cid }) }

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
            <AlgorandWalletConnector 
              walletConnected={this.walletConnected()} 
              wallet={this.state.wallet}
              setWallet={this.setWallet}
              />
          </Navbar.Group>
        </Navbar>
        <Switch>
          <Route exact path="/" >
            <Browser wallet={this.state.wallet} />
          </Route>
          <Route path="/create" >
            <Uploader onUploaded={this.setCID} cid={this.state.cid} wallet={this.state.wallet}>  </Uploader>
            <Divider />
            <AlgorandTokenizer cid={this.state.cid} wallet={this.state.wallet} />
          </Route>
          <Route path="/raf/:id" children={<RAF wallet={this.state.wallet} />}  >
          </Route>
          <Route path="/listing/:addr" children={<Listing  wallet={this.state.wallet} />} >
          </Route>
        </Switch>
      </Router>
    )
  }
}
module.exports = App
