/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import algosdk from 'algosdk'


import AlgoSignerWallet from './wallets/algosignerwallet'
import MyAlgoConnectWallet from './wallets/myalgoconnect'
import InsecureWallet from './wallets/insecurewallet'
import {Wallet} from './wallets/wallet'
import { SessionWallet } from './wallets/session-wallet'

import { Dialog, Button, Classes, HTMLSelect, Intent, Icon } from '@blueprintjs/core'
import { IconName } from '@blueprintjs/icons'

import {platform_settings as ps} from './lib/platform-conf'
import { useEffect } from 'react'
import { showErrorToaster } from './Toaster'



type AlgorandWalletConnectorProps = {
    darkMode: boolean
    walletConnected: boolean
    sessionWallet: SessionWallet
    updateWallet(sw: SessionWallet)
}

export function AlgorandWalletConnector(props:AlgorandWalletConnectorProps)  {

    const [selectorOpen, setSelectorOpen] = React.useState(false)

    useEffect(()=>{ connectWallet() },[])

    async function connectWallet() {
        await props.sessionWallet.connect()
        props.updateWallet(props.sessionWallet)
    }
    function disconnectWallet() { 
        props.sessionWallet.wipe()
        props.updateWallet(props.sessionWallet) 
    }

    function handleDisplayWalletSelection() { setSelectorOpen(true) }

    async function handleSelectedWallet(e) {
        const tgt = e.currentTarget
        const sw = new SessionWallet(tgt.id)

        if(!await sw.connect()) return showErrorToaster("Couldn't connect to wallet") 

        props.updateWallet(sw)
        setSelectorOpen(false)
    }

    function handleChangeAccount(e) {
        props.sessionWallet.setAccountIndex(parseInt(e.target.value))
        props.updateWallet(props.sessionWallet)
    }

    const dev_wallet = Object.keys(ps.dev.accounts).length>0?(
        <li>
            <Button id='dev-wallet' 
                large={true} 
                fill={true} 
                minimal={true} 
                outlined={true} 
                onClick={handleSelectedWallet}
                > 
                <div className='wallet-option'>
                    <img className='wallet-branding' src={ InsecureWallet.img(props.darkMode) } /> 
                    <h5>Development Wallet</h5>
                </div>
            </Button>
        </li>
    ):(<div></div>)



    if (!props.walletConnected) return (
        <div>
            <Button
                minimal={true}
                rightIcon='selection'
                intent='warning'
                outlined={true}
                onClick={handleDisplayWalletSelection}>Connect Wallet</Button>

            <Dialog isOpen={selectorOpen} title='Select Wallet' onClose={handleSelectedWallet} >
                <div className={Classes.DIALOG_BODY}>
                    <ul className='wallet-option-list'>
                        <li>
                            <Button id='algo-signer'
                                large={true} 
                                fill={true} 
                                minimal={true} 
                                outlined={true} 
                                onClick={handleSelectedWallet}
                                > 
                                <div className='wallet-option'>
                                    <img className='wallet-branding' src={ AlgoSignerWallet.img(props.darkMode) } />
                                    <h5>Algo Signer</h5>
                                </div>
                                </Button>
                        </li>
                        <li>
                            <Button id='my-algo-connect'
                                large={true} 
                                fill={true} 
                                minimal={true} 
                                outlined={true} 
                                onClick={handleSelectedWallet}
                                >
                                <div className='wallet-option'>
                                    <img className='wallet-branding' src={ MyAlgoConnectWallet.img(props.darkMode) } /> 
                                    <h5>MyAlgo Connect</h5>
                                </div>
                            </Button>
                        </li>
                        <li>
                            <Button id='insecure-wallet' 
                                large={true} 
                                fill={true} 
                                minimal={true} 
                                outlined={true} 
                                onClick={handleSelectedWallet}
                                > 
                                <div className='wallet-option'>
                                    <Icon icon='unlock' className='wallet-branding' />
                                    <h5>Insecure Wallet</h5>
                                </div>
                            </Button>
                        </li>
                        {dev_wallet}
                    </ul>
                </div>
            </Dialog>
        </div>
    )


    const addr_list = props.sessionWallet.accountList().map((addr, idx) => {
        return (<option value={idx} key={idx}> {addr.substr(0, 8)}...  </option>)
    })

    const iconprops = { 
        icon: 'symbol-circle' as IconName, 
        intent: 'success'  as Intent
    }

    return (
        <div>
            <HTMLSelect 
                onChange={handleChangeAccount} 
                minimal={true} 
                iconProps={iconprops} 
                defaultValue={props.sessionWallet.accountIndex()} >
                {addr_list}
            </HTMLSelect>
            <Button icon='log-out' minimal={true} onClick={disconnectWallet} ></Button>
        </div>
    )
}