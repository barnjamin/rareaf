/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import algosdk from 'algosdk'


import AlgoSignerWallet from './wallets/algosignerwallet'
import MyAlgoConnectWallet from './wallets/myalgoconnect'
import InsecureWallet from './wallets/insecurewallet'
import {Wallet} from './wallets/wallet'

import { Dialog, Button, Classes, HTMLSelect, Intent } from '@blueprintjs/core'
import { IconName } from '@blueprintjs/icons'

import {platform_settings as ps} from './lib/platform-conf'
import { useEffect } from 'react'

const wallet_preference_key = 'wallet-preference'
const acct_preference_key = 'acct-preference'
const mnemonic_key = 'mnemonic'

const allowedWallets =  { 
    'algo-signer': AlgoSignerWallet, 
    'my-algo-connect': MyAlgoConnectWallet, 
    'insecure-wallet': InsecureWallet,
    'dev-wallet':InsecureWallet
}

type AlgorandWalletConnectorProps = {
    darkMode: boolean
    walletConnected: boolean
    handleChangeAcct()
    setWallet(wallet: Wallet)
}

export default function AlgorandWalletConnector(props:AlgorandWalletConnectorProps)  {

    const [selectorOpen, setSelectorOpen] = React.useState(false)
    const [wallet, setWallet] = React.useState(undefined)


    useEffect(()=>{ 
        tryConnectWallet() 
        return () => { }
    }, [wallet])

    function disconnectWallet() {
        sessionStorage.setItem(wallet_preference_key, '')
        sessionStorage.setItem(acct_preference_key, '')
        sessionStorage.setItem(mnemonic_key, '')

        setWallet(undefined)
        props.setWallet(undefined)
    }

    async function tryConnectWallet() {
        if (wallet !== undefined) return

        const wname = sessionStorage.getItem(wallet_preference_key);
        const acct_idx = sessionStorage.getItem(acct_preference_key)
        const stored_mnemonic = sessionStorage.getItem(mnemonic_key)

        if (!(wname in allowedWallets)) return

        const w = new allowedWallets[wname](ps.algod.network)

        if (wname == 'insecure-wallet') {
            const mnemonic = stored_mnemonic?stored_mnemonic:prompt("Paste your mnemonic space delimited (why are you doing this?)")
            sessionStorage.setItem(mnemonic_key, mnemonic)
            const sk = algosdk.mnemonicToSecretKey(mnemonic)

            if (!await w.connect({[sk.addr]:mnemonic.split(" ")})) return disconnectWallet()
        } else if(wname == 'dev-wallet') {
            if (!await w.connect(ps.dev.accounts)) return disconnectWallet()
        }else{
            if (!await w.connect()) return disconnectWallet()
        }

        w.default_account = acct_idx

        setWallet(w)
        props.setWallet(w)
    }

    function handleDisconnectWallet() { disconnectWallet() }

    function handleDisplayWalletSelection() { setSelectorOpen(true) }

    async function handleSelectedWallet(e) {
        const tgt = e.currentTarget
        if (tgt.id in allowedWallets) {
            sessionStorage.setItem(wallet_preference_key, tgt.id)
            sessionStorage.setItem(acct_preference_key, "0")
            await tryConnectWallet()
        }
        setSelectorOpen(false)
    }

    function handleChangeAccount(e) {
        const addr_idx = e.target.value
        wallet.default_account = addr_idx
        sessionStorage.setItem(acct_preference_key, addr_idx)
        props.handleChangeAcct()
    }

    if (!props.walletConnected)

        return (
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
                                    <img className='wallet-branding' src={ InsecureWallet.img(props.darkMode) } /> 
                                    <h5>Insecure Wallet</h5>
                                </div>
                            </Button>
                        </li>
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
                    </ul>
                </div>
            </Dialog>
        </div>
    )


    const addr_list = wallet.accounts.map((addr, idx) => {
        return (<option value={idx} key={idx}> {addr.substr(0, 8)}...  </option>)
    })

    const iconprops = { 
        icon: 'symbol-circle' as IconName, 
        intent: 'success'  as Intent
    }

    return (
        <div>
            <HTMLSelect onChange={handleChangeAccount} minimal={true} iconProps={iconprops} defaultValue={wallet.default_account}>
                {addr_list}
            </HTMLSelect>
            <Button icon='log-out' minimal={true} onClick={handleDisconnectWallet} ></Button>
        </div>
    )
}