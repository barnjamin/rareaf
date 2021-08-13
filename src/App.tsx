/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {
  Router,
  Route,
  Switch
} from "react-router-dom";
import { Alignment, AnchorButton, Navbar } from "@blueprintjs/core"

import Minter from './Minter'
import Browser  from './Browser'
import { AlgorandWalletConnector } from './AlgorandWalletConnector'
import NFTViewer from './NFTViewer'
import Portfolio from './Portfolio'
import ListingViewer from './ListingViewer'
import Admin from './Admin'
import { SessionWallet } from 'algorand-session-wallet'
import { platform_settings as ps } from './lib/platform-conf'
import { ApplicationConfiguration } from './lib/application-conf';


type AppProps = {
  history: any
};

type AppState = {
  sessionWallet: SessionWallet
  accts: string[]
  connected: boolean
  ac: ApplicationConfiguration 
};


export default class App extends React.Component<AppProps, AppState> {
  constructor(props) {
    super(props)

    const sw = new SessionWallet(ps.algod.network)
    sw.connect()

    this.state = { 
      sessionWallet:  sw,
      accts: sw.accountList(),
      connected: sw.connected(),
      ac: ps.application,
    }


    this.updateWallet    = this.updateWallet.bind(this)
    this.updateAppConf    = this.updateAppConf.bind(this)

    this.initConfiguration()
  }

  updateWallet(sw: SessionWallet){ this.setState({ sessionWallet:sw, accts: sw.accountList(), connected: sw.connected() }) }
  updateAppConf(ac: ApplicationConfiguration) { this.setState({ac: ac}) }

  async initConfiguration(){
    let appConf = await ApplicationConfiguration.fromLocalStorage(this.state.ac)
    if(appConf !== undefined)  return this.updateAppConf(appConf)
    this.updateAppConf(await ApplicationConfiguration.fromNetwork(this.state.ac))
  }

  render() {
    const wallet = this.state.sessionWallet.wallet
    const acct = this.state.sessionWallet.getDefaultAccount()

    let adminNav = <div/>
    if(this.state.connected  && (!ps.application.admin_addr  || acct == ps.application.admin_addr)) {
      adminNav = <AnchorButton className='bp3-minimal' icon='key' text='Admin' href="/admin" />
    }

    let port = <div/>
    if(this.state.connected){
      port = <AnchorButton className='bp3-minimal' icon='folder-open' text='Portfolio' href="/portfolio" />
    }

    return (
      <Router history={this.props.history} >
        <Navbar >
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading><a href='/'><img height={"20px"} src={require('./img/default-monochrome.svg')}></img></a></Navbar.Heading>
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
              accts={this.state.accts}
              connected={this.state.connected} 
              updateWallet={this.updateWallet}
              />
          </Navbar.Group>
        </Navbar>
        <Switch>
          <Route path="/portfolio" >
            <Portfolio ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} /> 
          </Route>
          <Route path="/portfolio/:addr" >
            <Portfolio ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} /> 
          </Route>

          <Route path="/mint" children={<Minter ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} /> } />
          <Route path="/nft/:id" children={<NFTViewer ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} /> } />
          <Route path="/listing/:addr" children={<ListingViewer ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} />} />

          <Route exact path="/" >
            <Browser ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} />
          </Route>
          <Route path="/tag/:tag"  >
            <Browser ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} />
          </Route>
          <Route path="/admin"  >
            <Admin updateAppConf={this.updateAppConf} ac={this.state.ac} history={this.props.history} wallet={wallet} acct={acct} />
          </Route>
        </Switch>
      </Router>
    )
  }
}
