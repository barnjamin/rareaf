/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {algoConnectWallet} from './lib/algorand'
import {Button} from '@blueprintjs/core'


function AlgorandWalletConnector(props) {
    let intent = 'warning'
    let text = 'Connect Wallet'
    if(props.connected){
        intent='success'
        text = 'Wallet Connected'
    }
    return (<Button minimal={true} icon='selection' intent={intent} outlined={true} onClick={algoConnectWallet}>{text}</Button>)
}

export default AlgorandWalletConnector