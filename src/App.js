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

import {isAlgorandWalletConnected} from './lib/algorand'

import Uploader from './Uploader'
import AlgorandTokenizer from './AlgorandTokenizer'
import Browser  from './Browser'
import AlgorandWalletConnector from './AlgorandWalletConnector'
import RAF from './RAF'


class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = { 
      cid: undefined, 
      accounts: [],
      account_idx: 0
    }
    this.setCID = this.setCID.bind(this)

    this.setAccounts = this.setAccounts.bind(this)
    this.onAccountChange = this.onAccountChange.bind(this)

  }

  setAccounts(accts) {
    this.setState({accounts:accts})
  }

  onAccountChange(v) {
    this.setState({account_idx:v})
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
              connected={this.state.accounts.length>0}
              accounts={this.state.accounts}
              setAccounts={this.setAccounts} 
              onAccountChange={this.onAccountChange}/>
          </Navbar.Group>
        </Navbar>
        <Switch>
          <Route exact path="/" >
            <Browser />
          </Route>
          <Route path="/create" >
            <Uploader onUploaded={this.setCID} cid={this.state.cid}>  </Uploader>
            <Divider />
            <AlgorandTokenizer cid={this.state.cid} />
          </Route>
          <Route path="/raf/:id" children={<RAF />}>
          </Route>
        </Switch>
      </Router>
    )
  }
}
module.exports = App
