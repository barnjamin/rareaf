/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import { SessionWallet, allowedWallets } from 'algorand-session-wallet'

import { Dialog, Button, Classes, HTMLSelect, Intent, Icon } from '@blueprintjs/core'
import { IconName } from '@blueprintjs/icons'

import { useEffect } from 'react'
import { showErrorToaster } from './Toaster'
import {platform_settings as ps } from './lib/platform-conf'
import { RequestPopup } from './RequestPopup'


type AlgorandWalletConnectorProps = {
    darkMode: boolean
    connected: boolean
    accts: string[]
    sessionWallet: SessionWallet
    updateWallet(sw: SessionWallet)
}

export function AlgorandWalletConnector(props:AlgorandWalletConnectorProps)  {

    const [selectorOpen, setSelectorOpen] = React.useState(false)

    useEffect(()=>{ connectWallet() },[props.sessionWallet])

    async function connectWallet() {
        if(props.sessionWallet.connected()) return

        await props.sessionWallet.connect()
        props.updateWallet(props.sessionWallet)
    }

    function disconnectWallet() { 
        props.sessionWallet.disconnect()
        props.updateWallet(new SessionWallet(props.sessionWallet.network, props.sessionWallet.permissionCallback)) 
    }

    function handleDisplayWalletSelection() { setSelectorOpen(true) }

    async function handleSelectedWallet(e) {
        const choice = e.currentTarget.id

        if(!(choice in allowedWallets)) {
            props.sessionWallet.disconnect()
            return setSelectorOpen(false)
        }

        const sw = new SessionWallet(props.sessionWallet.network, props.sessionWallet.permissionCallback, choice)

        if(!await sw.connect()) {
            sw.disconnect()
            showErrorToaster("Couldn't connect to wallet") 
        }

        props.updateWallet(sw)

        setSelectorOpen(false)
    }

    function handleChangeAccount(e) {
        props.sessionWallet.setAccountIndex(parseInt(e.target.value))
        props.updateWallet(props.sessionWallet)
    }

    const walletOptions = []
    for(const [k,v] of Object.entries(allowedWallets)){
        walletOptions.push((
        <li key={k}>
            <Button id={k}
                large={true} 
                fill={true} 
                minimal={true} 
                outlined={true} 
                onClick={handleSelectedWallet}
                > 
                <div className='wallet-option'>
                    <img className='wallet-branding' src={  v.img(props.darkMode)} />
                    <h5>{v.displayName()}</h5>
                </div>
                </Button>
        </li>
        ))
    }

    if (!props.connected) return (
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
                        {walletOptions}
                    </ul>
                </div>
            </Dialog>
        </div>
    )


    const addr_list = props.accts.map((addr, idx) => {
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