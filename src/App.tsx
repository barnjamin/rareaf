/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {
  Router,
  Route,
  Switch
} from "react-router-dom";
import { Alignment, AnchorButton, Navbar, Divider } from "@blueprintjs/core"

import Minter from './Minter'
import Browser  from './Browser'
import { AlgorandWalletConnector } from './AlgorandWalletConnector'
import NFTViewer from './NFTViewer'
import Portfolio from './Portfolio'
import ListingViewer from './ListingViewer'
import Admin from './Admin'
import {Wallet} from './wallets/wallet'
import {platform_settings as ps} from './lib/platform-conf'
import { SessionWallet } from './wallets/session-wallet';


type AppProps = {
  history: any
};

type AppState = {
  sessionWallet: SessionWallet
};

export default class App extends React.Component<AppProps, AppState> {
  constructor(props) {
    super(props)

    this.state = { sessionWallet: new SessionWallet() }

    this.walletConnected = this.walletConnected.bind(this)
    this.updateWallet    = this.updateWallet.bind(this)
  }

  walletConnected(){
    return (this.state.sessionWallet.wallet !== undefined && this.state.sessionWallet.wallet.isConnected())
  }

  updateWallet(sw: SessionWallet){ 
    this.setState((state)=>{ return { sessionWallet:sw } }) 
  }

  render() {
    const wallet = this.state.sessionWallet.wallet
    const acct = wallet?wallet.getDefaultAccount():""

    let adminNav = <div/>
    if(this.walletConnected()  && (ps.application.admin_addr == "" || acct == ps.application.admin_addr)) {
      adminNav = <AnchorButton className='bp3-minimal' icon='key' text='Admin' href="/admin" />
    }

    let port = <div/>
    if(this.walletConnected()){
      port = <AnchorButton className='bp3-minimal' icon='folder-open' text='Portfolio' href="/portfolio" />
    }
    return (
      <Router history={this.props.history} >
        <Navbar >
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading><img height={"20px"} src={require('./img/default-monochrome.svg')}></img></Navbar.Heading>
            <Navbar.Divider />
            <AnchorButton className='bp3-minimal' icon='grid-view' text='Browse' href="/" />
            <AnchorButton className='bp3-minimal' icon='clean' text='Mint' href="/mint" />
            {port}
          </Navbar.Group >

          <Navbar.Group align={Alignment.RIGHT}>
            {adminNav}
            <AlgorandWalletConnector 
              darkMode={false}
              sessionWallet={this.state.sessionWallet}
              walletConnected={this.walletConnected()} 
              updateWallet={this.updateWallet}
              />
          </Navbar.Group>
        </Navbar>
        <Switch>
          <Route path="/portfolio" >
            <Portfolio history={this.props.history} wallet={wallet} acct={acct} /> 
          </Route>
          <Route path="/portfolio/:addr" >
            <Portfolio history={this.props.history} wallet={wallet} acct={acct} /> 
          </Route>

          <Route path="/mint" children={<Minter history={this.props.history} wallet={wallet} acct={acct} /> } />
          <Route path="/nft/:id" children={<NFTViewer history={this.props.history} wallet={wallet} acct={acct} /> } />
          <Route path="/listing/:addr" children={<ListingViewer  history={this.props.history} wallet={wallet} acct={acct} />} />

          <Route exact path="/" >
            <Browser history={this.props.history} wallet={wallet} acct={acct} />
          </Route>
          <Route path="/tag/:tag"  >
            <Browser history={this.props.history} wallet={wallet} acct={acct} />
          </Route>
          <Route path="/admin"  >
            <Admin history={this.props.history} wallet={wallet} acct={acct} />
          </Route>
        </Switch>
      </Router>
    )
  }
}
