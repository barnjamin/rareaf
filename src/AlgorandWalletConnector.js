/* eslint-disable no-console */
'use strict'

import AlgoSignerWallet from './wallets/algosignerwallet'
import MyAlgoConnectWallet from './wallets/myalgoconnect'

import { platform_settings } from './lib/platform-conf'

import React, {useState} from 'react'
import {Dialog, Button, Classes, HTMLSelect, Icon} from '@blueprintjs/core'

class AlgorandWalletConnector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            walletSelectorOpen:false,
            allowedWallets:{
                'algo-signer':AlgoSignerWallet,
                'my-algo-connect':MyAlgoConnectWallet,
            },
            wallet: undefined
        }
        //this.componentDidMount = this.componentDidMount.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.handleDisplayChooseWallet = this.handleDisplayChooseWallet.bind(this)
        this.handleChoseWallet = this.handleChoseWallet.bind(this)
    }

    handleDisplayChooseWallet(){
        this.setState({walletSelectorOpen:true})
    }

    async handleChoseWallet(e){
        const tgt = e.currentTarget
        if(tgt.id in this.state.allowedWallets){
            const wallet = new this.state.allowedWallets[tgt.id](platform_settings.algod.network)

            this.setState({wallet: wallet})

            if(!await wallet.connect())
                alert("Failzore: Couldnt connect to wallet, is it definitely installed?")

            this.props.setWallet(wallet)
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
                        onClick={this.handleDisplayChooseWallet}>Connect Wallet</Button>

                    <Dialog isOpen={this.state.walletSelectorOpen} title='Select Wallet' onClose={this.handleChoseWallet} >
                        <div className={Classes.DIALOG_BODY}>
                            <ul className='wallet-option-list'>
                                <li> 
                                    <Button id={'algo-signer'} large={true} fill={true} minimal={true} outlined={true} onClick={this.handleChoseWallet}>Algo Signer</Button>
                                </li>
                                <li> 
                                    <Button id={'my-algo-connect'} large={true} fill={true} minimal={true} outlined={true} onClick={this.handleChoseWallet}>My Algo Connect</Button>
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
            <HTMLSelect onChange={this.handleChange} minimal={true} iconProps={iconprops} >
                {addr_list}
            </HTMLSelect>
        )
    }
}

export default AlgorandWalletConnector