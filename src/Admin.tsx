/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import { Wallet } from './wallets/wallet'
import {platform_settings as ps} from './lib/platform-conf'
import { Application } from './lib/application';
import { useEffect } from 'react';
import {Button, Tabs, Tab, InputGroup } from '@blueprintjs/core'
import { useState } from 'react';

type AdminProps = { 
    history: any
    wallet: Wallet
    acct: string
};

export default function Admin(props: AdminProps) {
    if (props.acct != ps.address) return (<div className='container'><p>no</p></div>)


    const [algod, setAlgod] = React.useState(ps.algod)
    const [indexer, setIndexer] = React.useState(ps.indexer)
    const [ipfs, setIPFS] = React.useState(ps.ipfs)
    const [loading, setLoading] = React.useState(false)
    const [appConf, setApp] = React.useState({
        owner: props.acct,
        name:"RareAF",
        unit: "raf",
        fee: "1000"
    })

    function setAlgodValue (k: string, v: string){
        const val = k=="port"? parseInt(v) :v
        setAlgod(algod =>({ ...algod, [k]: val }))
    }

    function setIndexerValue (k: string, v: string){
        const val = k=="port"? parseInt(v) :v
        setIndexer(indexer =>({ ...indexer, [k]: val }))
    }

    function setIpfsValue (k: string, v: string){
        setIPFS(ipfs =>({ ...ipfs, [k]: v }))
    }

    function setAppConf(k: string, v: string) {
        setApp(appConf =>({ ...appConf, [k]: v }))
    }

    function createApp(){

        setLoading(true)
        const app  = new Application(appConf)
        app.create(props.wallet).then(success=>{ 
            console.log(success)  
            setLoading(false)
        })
    }


    let appComponent = <ApplicationCreator   set={setAppConf} create={createApp} {...appConf} loading={loading} />
    if (appConf.id != 0){
        // Resolve app stuff
    }

    return (
        <div className='container config-container'>
            <Tabs id='configuration' vertical={true}>
                <Tab title='Algod' id='algod' panel={<Algod setProp={setAlgodValue} {...algod} />} />
                <Tab title='Indexer' id='index' panel={ <Indexer setProp={setIndexerValue} {...indexer} /> } />
                <Tab title='Ipfs' id='ipfs' panel={ <IPFSConfig setProp={setIpfsValue} {...ipfs} /> } />
                <Tab title='App' id='app' panel={ appComponent } />
            </Tabs>
        </div>
    )
}

type AlgodConfigProps = {
    server: string
    port: number
    token: string
    network: string
    setProp(key: string, val: string)
}

function Algod(props: AlgodConfigProps)  {
    const setter = (name: string)=>{ return (e)=>{ props.setProp(name, e.target.value) } }

    return (
        <div className='content algod-config'>
            <InputGroup 
                onChange={setter("server")}
                placeholder="API Server"
                large={true}
                value={props.server} 
            />
            <InputGroup
                onChange={setter("port")}
                placeholder="API Port" 
                large={true}
                value={props.port.toString()} 
            />
            <InputGroup 
                onChange={setter("token")}
                placeholder="API Token"
                large={true}
                value={props.token} 
            />
            <InputGroup 
                onChange={setter("network")}
                placeholder="Network" //Make this a dropdown?
                large={true}
                value={props.network} 
            />
        </div>
    )

}

type IndexerConfigProps = {
    server: string
    port: number
    token: string
    setProp(key: string, val: string)
}

function Indexer(props: IndexerConfigProps)  {
    const setter = (name: string)=>{ return (e)=>{ props.setProp(name, e.target.value) } }

    return (
        <div className='content indexer-config'>
            <InputGroup 
                onChange={setter("server")}
                placeholder="Indexer Server"
                large={true}
                value={props.server} 
            />
            <InputGroup
                onChange={setter("port")}
                placeholder="Indexer Port" 
                large={true}
                value={props.port.toString()} 
            />
            <InputGroup 
                onChange={setter("token")}
                placeholder="Indexer Token"
                large={true}
                value={props.token} 
            />
        </div>
    )
}

type IPFSConfigProps = {
    host: string
    display: string 
    setProp(key: string, val: string)
}

function IPFSConfig(props: IPFSConfigProps)  {
    const setter = (name: string)=>{ return (e)=>{ props.setProp(name, e.target.value) } }

    return (
        <div className='content indexer-config'>
            <InputGroup 
                onChange={setter("host")}
                placeholder="IPFS Host"
                large={true}
                value={props.host} 
            />
            <InputGroup
                onChange={setter("display")}
                placeholder="IPFS Display URL" 
                large={true}
                value={props.display} 
            />
        </div>
    )
}

type ApplicationCreatorProps = {
    name: string
    unit: string
    fee: string
    loading: boolean
    set(key: string, value: string)
    create()
};

function ApplicationCreator(props: ApplicationCreatorProps) {

    return (
        <div>
            <InputGroup
                onChange={e=>{props.set('name', e.target.value)}}
                placeholder="Application Name"
                large={true}
                value={props.name}
            />
            <InputGroup
                onChange={e=>{props.set('unit', e.target.value)}}
                placeholder="Unit Name"
                large={true}
                value={props.unit}
            />
            <InputGroup
                onChange={e=>{props.set('fee', e.target.value)}}
                placeholder="Fee"
                large={true}
                value={props.fee}
            />
            <Button loading={props.loading} onClick={props.create} text='Create'/>
        </div>
    )
}