/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {algoConnectWallet, getAccounts} from './lib/algorand'
import {Button} from '@blueprintjs/core'

class AlgorandWalletConnector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            connected : false,
            account_list : []
        }
        this.componentDidMount = this.componentDidMount.bind(this)
    }

    async componentDidMount(){
        if(this.state.connected){                
            return
        }

        try{
            const accts = await getAccounts();
            this.setState({account_list:accts, connected:true})
        } catch (e) {               
            this.setState({account_list:[], connected:false})
            console.error("Cant get accounts:", e) 
        }
    }

    render(){
        if(!this.state.connected){
            return (<Button 
                minimal={true} 
                icon='selection' 
                intent='warning' 
                outlined={true} 
                onClick={algoConnectWallet}>Connect Wallet</Button>)
        }

        const addr_list = this.state.account_list.map(a=>{                
            const addr  = a.address
            return (<option value={addr} key={addr}>{addr.substr(0,5)}...</option>)
        })
        return (<div className='bp3-large' ><select >{addr_list}</select></div>)
    }
}

export default AlgorandWalletConnector