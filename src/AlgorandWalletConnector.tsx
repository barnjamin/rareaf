/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import { SessionWallet, allowedWallets } from 'algorand-session-wallet'

import { Dialog, Button, Classes, HTMLSelect, Intent, Icon } from '@blueprintjs/core'
import { IconName } from '@blueprintjs/icons'

import { useEffect } from 'react'
import { showErrorToaster } from './Toaster'
import {platform_settings as ps } from './lib/platform-conf'


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
        await props.sessionWallet.connect()
        props.updateWallet(props.sessionWallet)
    }

    function disconnectWallet() { 
        props.sessionWallet.disconnect()
        props.updateWallet(new SessionWallet(props.sessionWallet.network)) 
    }

    function handleDisplayWalletSelection() { setSelectorOpen(true) }

    async function handleSelectedWallet(e) {
        const tgt = e.currentTarget
        const sw = new SessionWallet(ps.algod.network, tgt.id)

        if(!await sw.connect()) {
            sw.disconnect()
            showErrorToaster("Couldn't connect to wallet") 
        }else{
            props.updateWallet(sw)
        }

        setSelectorOpen(false)
    }

    function handleChangeAccount(e) {
        props.sessionWallet.setAccountIndex(parseInt(e.target.value))
        props.updateWallet(props.sessionWallet)
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
                        <li>
                            <Button id='algo-signer'
                                large={true} 
                                fill={true} 
                                minimal={true} 
                                outlined={true} 
                                onClick={handleSelectedWallet}
                                > 
                                <div className='wallet-option'>
                                    <img className='wallet-branding' src={  allowedWallets['algo-signer'].img(props.darkMode)} />
                                    <h5>{allowedWallets['algo-signer'].displayName()}</h5>
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
                                    <img className='wallet-branding' src={ allowedWallets['my-algo-connect'].img(props.darkMode)  } /> 
                                    <h5>{allowedWallets['my-algo-connect'].displayName()}</h5>
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
                                    <img className='wallet-branding' src={ allowedWallets['insecure-wallet'].img(props.darkMode)  } /> 
                                    <h5>{allowedWallets['insecure-wallet'].displayName()}</h5>
                                </div>
                            </Button>
                        </li>
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