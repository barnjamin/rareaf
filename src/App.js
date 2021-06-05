/* eslint-disable no-console */
'use strict'

import React from 'react'
import {
  Router,
  Route,
  Switch
} from "react-router-dom";
import { Alignment, AnchorButton, Navbar, Divider } from "@blueprintjs/core"

import Minter from './Minter'
import Browser  from './Browser'
import AlgorandWalletConnector from './AlgorandWalletConnector'
import RAF from './RAF'
import ListingViewer from './ListingViewer'
import Portfolio from './Portfolio'


class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = { wallet: undefined }

    this.setWallet = this.setWallet.bind(this)
    this.walletConnected = this.walletConnected.bind(this)
  }

  walletConnected(){
    return (this.state.wallet !== undefined && this.state.wallet.isConnected())
  }

  setWallet(wallet) {
    this.setState({wallet:wallet})
  }

  render() {
    return (
      <Router history={this.props.history} >
        <Navbar >
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading> Rare AF</Navbar.Heading>
            <Navbar.Divider />
            <AnchorButton className='bp3-minimal' icon='grid-view' text='Browse' href="/" />
            <AnchorButton className='bp3-minimal' icon='folder-open' text='Portfolio' href="/portfolio" />
            <AnchorButton className='bp3-minimal' icon='new-object' text='Mint' href="/mint" />
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
          <Route path="/portfolio" >
            <Portfolio history={this.props.history} wallet={this.state.wallet} /> 
          </Route>
          <Route path="/portfolio/:addr" >
            <Portfolio history={this.props.history} wallet={this.state.wallet} /> 
          </Route>

          <Route path="/mint" children={<Minter history={this.props.history} wallet={this.state.wallet} /> } />
          <Route path="/raf/:id" children={<RAF history={this.props.history} wallet={this.state.wallet} />}  />
          <Route path="/listing/:addr" children={<ListingViewer  history={this.props.history} wallet={this.state.wallet} />} />

          <Route exact path="/" >
            <Browser 
              history={this.props.history} 
              wallet={this.state.wallet} 
              />
          </Route>
          <Route path="/tag/:tag"  >
            <Browser 
              history={this.props.history} 
              wallet={this.state.wallet} 
              />
          </Route>
        </Switch>
      </Router>
    )
  }
}
module.exports = App
