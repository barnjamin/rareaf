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
import {SessionWallet, PermissionResult, SignedTxn, Wallet} from 'algorand-session-wallet'
import {platform_settings as ps} from './lib/platform-conf'
import {RequestPopupProps, RequestPopup, PopupPermission, DefaultPopupProps} from './RequestPopup'


type AppProps = {
  history: any
};

const timeout = async(ms: number) => new Promise(res => setTimeout(res, ms));

export default function App(props: AppProps) {

  const [popupProps, setPopupProps] = React.useState(DefaultPopupProps)

  const popupCallback = {
    async request(pr: PermissionResult): Promise<SignedTxn[]> {
      let result = PopupPermission.Undecided;
      setPopupProps({isOpen:true, handleOption: (res: PopupPermission)=>{ result = res} })		
      

      async function wait(): Promise<SignedTxn[]> {
        while(result === PopupPermission.Undecided) await timeout(50);

        if(result == PopupPermission.Proceed) return pr.approved()
        return pr.declined()
      }

      //get signed
      const txns = await wait()

      //close popup
      setPopupProps(DefaultPopupProps)

      //return signed
      return txns
    }
  }


  const sw = new SessionWallet(ps.algod.network, popupCallback)

  const [sessionWallet, setSessionWallet] =  React.useState(sw)
  const [accts, setAccounts] = React.useState(sw.accountList())
  const [connected, setConnected] = React.useState(sw.connected())

  function updateWallet(sw: SessionWallet){ 
    setSessionWallet(sw)
    setAccounts(sw.accountList())
    setConnected(sw.connected())
  }

  const wallet = sessionWallet.wallet
  const acct = sessionWallet.getDefaultAccount()

  let adminNav = <div/>
  if(connected  && (ps.application.admin_addr == "" || acct == ps.application.admin_addr)) {
    adminNav = <AnchorButton className='bp3-minimal' icon='key' text='Admin' href="/admin" />
  }

  let port = <div/>
  if(connected){
    port = <AnchorButton className='bp3-minimal' icon='folder-open' text='Portfolio' href="/portfolio" />
  }

  return (
      <div>
        <Router history={props.history} >
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
                sessionWallet={sessionWallet}
                accts={accts}
                connected={connected} 
                updateWallet={updateWallet}
                />
            </Navbar.Group>
          </Navbar>
          <Switch>
            <Route path="/portfolio" >
              <Portfolio history={props.history} wallet={wallet} acct={acct} /> 
            </Route>
            <Route path="/portfolio/:addr" >
              <Portfolio history={props.history} wallet={wallet} acct={acct} /> 
            </Route>

            <Route path="/mint" children={<Minter history={props.history} wallet={wallet} acct={acct} /> } />
            <Route path="/nft/:id" children={<NFTViewer history={props.history} wallet={wallet} acct={acct} /> } />
            <Route path="/listing/:addr" children={<ListingViewer  history={props.history} wallet={wallet} acct={acct} />} />

            <Route exact path="/" >
              <Browser history={props.history} wallet={wallet} acct={acct} />
            </Route>
            <Route path="/tag/:tag"  >
              <Browser history={props.history} wallet={wallet} acct={acct} />
            </Route>
            <Route path="/admin"  >
              <Admin history={props.history} wallet={wallet} acct={acct} />
            </Route>
          </Switch>
        </Router>
        <RequestPopup {...popupProps}/>
      </div>
  )
}
