/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {algoConnectWallet, getAccounts} from './lib/algorand'
import {Button, HTMLSelect, Icon} from '@blueprintjs/core'

class AlgorandWalletConnector extends React.Component {
    constructor(props) {
        super(props);
        this.componentDidMount = this.componentDidMount.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    async componentDidMount(){
        if(this.props.connected) return

        try{
            const accts = await getAccounts();
            this.props.setAccounts(accts)
        } catch (e) {               
            this.setState({account_list:[], connected:false})
            console.error("Cant get accounts:", e) 
        }
    }

    handleChange(e){
        this.props.onAccountChange(e.target.value);
    }

    render(){
        if(!this.props.connected){
            return (<Button 
                minimal={true} 
                rightIcon='selection' 
                intent='warning' 
                outlined={true} 
                onClick={algoConnectWallet}>Connect Wallet</Button>)
        }

        const addr_list = this.props.accounts.map((a, idx)=>{                
            const addr  = a.address
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