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
import AlgorandWalletConnector from './AlgorandWalletConnector'
import NFTViewer from './NFTViewer'
import Portfolio from './Portfolio'
import ListingViewer from './ListingViewer'
import {Wallet} from './wallets/wallet'

type AppProps = {
  history: any

};

type AppState = {
  wallet: Wallet
  acct: string
};

class App extends React.Component<AppProps, AppState> {
  constructor(props) {
    super(props)

    this.state = { 
      wallet: undefined,
      acct: undefined
    }

    this.setWallet = this.setWallet.bind(this)
    this.walletConnected = this.walletConnected.bind(this)
    this.handleChangeAcct = this.handleChangeAcct.bind(this)
  }

  walletConnected(){
    return (this.state.wallet !== undefined && this.state.wallet.isConnected())
  }

  setWallet(wallet) {
    this.setState({wallet:wallet, acct: wallet.getDefaultAccount()})
  }

  handleChangeAcct() {
    if(!this.walletConnected()) return

    this.setWallet(this.state.wallet)
  }

  render() {
    return (
      <Router history={this.props.history} >
        <Navbar >
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading><img height={"20px"} src={require('./img/default-monochrome-white.svg')}></img></Navbar.Heading>
            <Navbar.Divider />
            <AnchorButton className='bp3-minimal' icon='grid-view' text='Browse' href="/" />
            <AnchorButton className='bp3-minimal' icon='folder-open' text='Portfolio' href="/portfolio" />
            <AnchorButton className='bp3-minimal' icon='clean' text='Mint' href="/mint" />
          </Navbar.Group >
          <Navbar.Group align={Alignment.RIGHT}>
            <AlgorandWalletConnector 
              handleChangeAcct={this.handleChangeAcct}
              walletConnected={this.walletConnected()} 
              setWallet={this.setWallet}
              />
          </Navbar.Group>
        </Navbar>
        <Switch>
          <Route path="/portfolio" >
            <Portfolio history={this.props.history} wallet={this.state.wallet} acct={this.state.acct} /> 
          </Route>
          <Route path="/portfolio/:addr" >
            <Portfolio history={this.props.history} wallet={this.state.wallet} acct={this.state.acct} /> 
          </Route>

          <Route path="/mint" children={<Minter history={this.props.history} wallet={this.state.wallet} acct={this.state.acct} /> } />
          <Route path="/nft/:id" children={<NFTViewer history={this.props.history} wallet={this.state.wallet} acct={this.state.acct} /> } />
          <Route path="/listing/:addr" children={<ListingViewer  history={this.props.history} wallet={this.state.wallet} acct={this.state.acct} />} />

          <Route exact path="/" >
            <Browser 
              history={this.props.history} 
              wallet={this.state.wallet} 
              acct={this.state.acct}
              />
          </Route>
          <Route path="/tag/:tag"  >
            <Browser 
              history={this.props.history} 
              wallet={this.state.wallet} 
              acct={this.state.acct}
              />
          </Route>
        </Switch>
      </Router>
    )
  }
}
module.exports = App
