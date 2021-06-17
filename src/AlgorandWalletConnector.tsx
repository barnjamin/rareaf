/* eslint-disable no-console */
'use strict'

import AlgoSignerWallet from './wallets/algosignerwallet'
import MyAlgoConnectWallet from './wallets/myalgoconnect'
import InsecureWallet from './wallets/insecurewallet'

import {platform_settings as ps} from './lib/platform-conf'
import {Wallet} from './wallets/wallet'
import React from 'react'
import { Dialog, Button, Classes, HTMLSelect, Intent } from '@blueprintjs/core'
import { IconName } from '@blueprintjs/icons'

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


type AlgorandWalletConnectorProps = {
    walletConnected: boolean
    handleChangeAcct()
    setWallet(wallet: Wallet)
}

type AlgorandWalletConnectorState = {
    selectorOpen: boolean
    allowedWallets: object
    wallet: Wallet
}

class AlgorandWalletConnector extends React.Component<AlgorandWalletConnectorProps, AlgorandWalletConnectorState> {

    state: AlgorandWalletConnectorState = {
            selectorOpen: false,
            allowedWallets: {
                'algo-signer': AlgoSignerWallet,
                'my-algo-connect': MyAlgoConnectWallet,
                'insecure-wallet': InsecureWallet
            },
            wallet: undefined
    }

    constructor(props) {
        super(props);

        this.componentDidMount = this.componentDidMount.bind(this)

        this.tryConnectWallet = this.tryConnectWallet.bind(this)
        this.disconnectWallet = this.disconnectWallet.bind(this)

        this.handleChangeAccount = this.handleChangeAccount.bind(this)
        this.handleDisplayWalletSelection = this.handleDisplayWalletSelection.bind(this)
        this.handleSelectedWallet = this.handleSelectedWallet.bind(this)
        this.handleDisconnectWallet = this.handleDisconnectWallet.bind(this)
    }

    componentDidMount() {
        this.tryConnectWallet()
    }


    disconnectWallet() {
        //Unset state
        this.props.setWallet(undefined)
        this.setState({ wallet: undefined })
        sessionStorage.setItem(wallet_preference_key, '')
        sessionStorage.setItem(acct_preference_key, '')
    }

    async tryConnectWallet() {
        if (this.state.wallet !== undefined) return

        const wname = sessionStorage.getItem(wallet_preference_key);
        const acct_idx = sessionStorage.getItem(acct_preference_key)

        if (!(wname in this.state.allowedWallets)) return

        const wallet = new this.state.allowedWallets[wname](ps.algod.network)

        if (wname == 'insecure-wallet') {
            if (!await wallet.connect(pkToMnemonic)) return this.disconnectWallet()
        } else {
            if (!await wallet.connect()) return this.disconnectWallet()
        }

        wallet.default_account = acct_idx

        this.setState({ wallet: wallet })
        this.props.setWallet(wallet)
    }

    handleDisconnectWallet() {
        this.disconnectWallet()
    }

    handleDisplayWalletSelection() {
        this.setState({ selectorOpen: true })
    }

    async handleSelectedWallet(e) {
        const tgt = e.currentTarget
        if (tgt.id in this.state.allowedWallets) {
            sessionStorage.setItem(wallet_preference_key, tgt.id)
            sessionStorage.setItem(acct_preference_key, "0")
            await this.tryConnectWallet()
        }
        this.setState({ selectorOpen: false })
    }

    handleChangeAccount(e) {
        const addr_idx = e.target.value
        this.state.wallet.default_account = addr_idx
        sessionStorage.setItem(acct_preference_key, addr_idx)
        this.props.handleChangeAcct()
    }

    render() {
        if (!this.props.walletConnected)
            return (
                <div>
                    <Button
                        minimal={true}
                        rightIcon='selection'
                        intent='warning'
                        outlined={true}
                        onClick={this.handleDisplayWalletSelection}>Connect Wallet</Button>

                    <Dialog isOpen={this.state.selectorOpen} title='Select Wallet' onClose={this.handleSelectedWallet} >
                        <div className={Classes.DIALOG_BODY}>
                            <ul className='wallet-option-list'>
                                <li>
                                    <Button id='algo-signer'
                                        large={true} 
                                        fill={true} 
                                        minimal={true} 
                                        outlined={true} 
                                        onClick={this.handleSelectedWallet}
                                        text='Algo Signer' />
                                </li>
                                <li>
                                    <Button id='my-algo-connect'
                                        large={true} 
                                        fill={true} 
                                        minimal={true} 
                                        outlined={true} 
                                        onClick={this.handleSelectedWallet}
                                        text='My Algo Connect' />
                                </li>
                                <li>
                                    <Button id='insecure-wallet' 
                                        large={true} 
                                        fill={true} 
                                        minimal={true} 
                                        outlined={true} 
                                        onClick={this.handleSelectedWallet}
                                        text='Insecure Wallet'/>
                                </li>
                            </ul>
                        </div>
                    </Dialog>
                </div>
            )


        const addr_list = this.state.wallet.accounts.map((addr, idx) => {
            return (<option value={idx} key={idx}> {addr.substr(0, 8)}...  </option>)
        })

        const iconprops = { 
            icon: 'symbol-circle' as IconName, 
            intent: 'success'  as Intent
        }

        return (
            <div>
                <HTMLSelect onChange={this.handleChangeAccount} minimal={true} iconProps={iconprops} defaultValue={this.state.wallet.default_account}>
                    {addr_list}
                </HTMLSelect>
                <Button icon='log-out' minimal={true} onClick={this.handleDisconnectWallet} ></Button>
            </div>
        )
    }
}

export default AlgorandWalletConnector