/* eslint-disable no-console */
'use strict'

import AlgoSignerWallet from './wallets/algosignerwallet'
import MyAlgoConnectWallet from './wallets/myalgoconnect'
import InsecureWallet from './wallets/insecurewallet'

import { platform_settings } from './lib/platform-conf'

import React from 'react'
import {Dialog, Button, Classes, HTMLSelect} from '@blueprintjs/core'

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


class AlgorandWalletConnector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletSelectorOpen:false,
            allowedWallets:{
                'algo-signer':AlgoSignerWallet,
                'my-algo-connect':MyAlgoConnectWallet,
                'insecure-wallet':InsecureWallet
            },
            wallet: undefined
        }

        this.componentDidMount = this.componentDidMount.bind(this)

        this.tryConnectWallet = this.tryConnectWallet.bind(this)
        this.disconnectWallet = this.disconnectWallet.bind(this)

        this.handleChange                  = this.handleChange.bind(this)
        this.handleDisplayWalletSelection  = this.handleDisplayWalletSelection.bind(this)
        this.handleSelectedWallet       = this.handleSelectedWallet.bind(this)
        this.handleDisconnectWallet     = this.handleDisconnectWallet.bind(this)
    }

    componentDidMount(){
        this.tryConnectWallet()
    }


    disconnectWallet(){
        //Unset state
        this.props.setWallet(undefined)
        this.setState({wallet:undefined})
        sessionStorage.setItem('wallet-preference','')
    }

    async tryConnectWallet(){
        if(this.state.wallet === undefined){

            const wname = sessionStorage.getItem('wallet-preference');
            if(!(wname in this.state.allowedWallets)) return

            const wallet = new this.state.allowedWallets[wname](platform_settings.algod.network)

            if (wname == 'insecure-wallet'){
                if(!await wallet.connect(pkToMnemonic)){
                    alert("Couldn't connect to preferred wallet: ", wname)
                    this.disconnectWallet()
                    return
                }
            }else{
                if(!await wallet.connect()){
                    alert("Couldn't connect to preferred wallet: ", wname)
                    this.disconnectWallet()
                    return
                }
            }

            this.setState({wallet: wallet})
            this.props.setWallet(wallet)
        }
    }

    handleDisconnectWallet(){
        this.disconnectWallet()
    }

    handleDisplayWalletSelection(){
        this.setState({walletSelectorOpen:true})
    }

    async handleSelectedWallet(e){
        const tgt = e.currentTarget
        if(tgt.id in this.state.allowedWallets){
            sessionStorage.setItem('wallet-preference', tgt.id)
            await this.tryConnectWallet()
        }
        this.setState({walletSelectorOpen:false})
    }

    handleChange(e){
        this.props.wallet.default_account = e.target.value
    }

    render(){
        if(!this.props.walletConnected) 
            return (
                <div>
                    <Button 
                        minimal={true} 
                        rightIcon='selection' 
                        intent='warning' 
                        outlined={true} 
                        onClick={this.handleDisplayWalletSelection}>Connect Wallet</Button>

                    <Dialog isOpen={this.state.walletSelectorOpen} title='Select Wallet' onClose={this.handleSelectedWallet} >
                        <div className={Classes.DIALOG_BODY}>
                            <ul className='wallet-option-list'>
                                <li> 
                                    <Button id={'algo-signer'} large={true} fill={true} minimal={true} outlined={true} onClick={this.handleSelectedWallet}>Algo Signer</Button>
                                </li>
                                <li> 
                                    <Button id={'my-algo-connect'} large={true} fill={true} minimal={true} outlined={true} onClick={this.handleSelectedWallet}>My Algo Connect</Button>
                                </li>
                                <li> 
                                    <Button id={'insecure-wallet'} large={true} fill={true} minimal={true} outlined={true} onClick={this.handleSelectedWallet}>Insecure Wallet</Button>
                                </li>
                            </ul>
                        </div>
                    </Dialog>
                </div>
            )


        const addr_list = this.props.wallet.accounts.map((addr, idx)=>{                
            return (<option value={idx} key={idx}>{addr.substr(0,8)}...</option>)
        })

        const iconprops = {icon:'symbol-circle', intent:'success'}

        return (
            <div>
            <HTMLSelect onChange={this.handleChange} minimal={true} iconProps={iconprops} >
                {addr_list}
            </HTMLSelect>
            <Button icon='log-out' minimal={true}  onClick={this.handleDisconnectWallet} ></Button>
            </div>
        )
    }
}

export default AlgorandWalletConnector