/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import AlgoSignerWallet from './wallets/algosignerwallet'
import MyAlgoConnectWallet from './wallets/myalgoconnect'
import InsecureWallet from './wallets/insecurewallet'
import {Wallet} from './wallets/wallet'

import { Dialog, Button, Classes, HTMLSelect, Intent } from '@blueprintjs/core'
import { IconName } from '@blueprintjs/icons'

import {platform_settings as ps} from './lib/platform-conf'
import { useEffect } from 'react'

const pkToMnemonic = {
    "6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI": [
        "loan", "journey", "alarm", "garage", "bulk", "olympic", "detail", "pig", "edit", "other", "brisk", "sense", "below",
        "when", "false", "ripple", "cute", "buffalo", "tissue", "again", "boring", "manual", "excuse", "absent", "injury"
    ],
    "7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM": [
        "genuine", "burger", "urge", "heart", "spot", "science", "vague", "guess", "timber", "rich", "olympic", "cheese", "found",
        "please", "then", "snack", "nice", "arrest", "coin", "seminar", "pyramid", "adult", "flip", "absorb", "apology"
    ],
    "DOG2QFGWQSFRJOQYW7I7YL7X7DEDIOPPBDV3XE34NMMXYYG32CCXXNFAV4": [
        "train", "rather", "absorb", "mouse", "tone", "scorpion", "group", "vacuum", "depth", "nothing", "assault", "silent", "fox",
        "relax", "depart", "lady", "hurdle", "million", "jaguar", "ensure", "define", "mule", "silk", "able", "order"
    ],
}

const wallet_preference_key = 'wallet-preference'
const acct_preference_key = 'acct-preference'
const allowedWallets =  { 'algo-signer': AlgoSignerWallet, 'my-algo-connect': MyAlgoConnectWallet, 'insecure-wallet': InsecureWallet }

type AlgorandWalletConnectorProps = {
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
        props.setWallet(undefined)
        setWallet(undefined)
        sessionStorage.setItem(wallet_preference_key, '')
        sessionStorage.setItem(acct_preference_key, '')
    }

    async function tryConnectWallet() {
        if (wallet !== undefined) return

        const wname = sessionStorage.getItem(wallet_preference_key);
        const acct_idx = sessionStorage.getItem(acct_preference_key)

        if (!(wname in allowedWallets)) return

        const w = new allowedWallets[wname](ps.algod.network)

        if (wname == 'insecure-wallet') {
            if (!await w.connect(pkToMnemonic)) return disconnectWallet()
        } else {
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
                                > <img className='wallet-branding' src={ AlgoSignerWallet.img(true) } />Algo Signer
                                </Button>
                        </li>
                        <li>
                            <Button id='my-algo-connect'
                                large={true} 
                                fill={true} 
                                minimal={true} 
                                outlined={true} 
                                onClick={handleSelectedWallet}
                                ><img className='wallet-branding' src={ MyAlgoConnectWallet.img(true) } /> MyAlgo Connect</Button>
                        </li>
                        <li>
                            <Button id='insecure-wallet' 
                                large={true} 
                                fill={true} 
                                minimal={true} 
                                outlined={true} 
                                onClick={handleSelectedWallet}
                                > Insecure Wallet </Button>
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