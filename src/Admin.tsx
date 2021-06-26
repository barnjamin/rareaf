/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import { Wallet } from './wallets/wallet'
import {platform_settings as ps} from './lib/platform-conf'
import { Application } from './lib/application';
import {Button, Tabs, Tab, InputGroup } from '@blueprintjs/core'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from  'react-syntax-highlighter/dist/esm/styles/hljs'


type AdminProps = { 
    history: any
    wallet: Wallet
    acct: string
};

export default function Admin(props: AdminProps) {
    if (props.acct != ps.application.owner && ps.application.owner != "")  return (<div className='container'><p>no</p></div>)

    const [algod, setAlgod] = React.useState(ps.algod)
    const [indexer, setIndexer] = React.useState(ps.indexer)
    const [ipfs, setIPFS] = React.useState(ps.ipfs)
    const [loading, setLoading] = React.useState(false)
    const [appConf, setApp] = React.useState(ps.application)
    const [hasChanges, setHasChanges] = React.useState(false)

    function setAlgodValue (k: string, v: string){
        const val = k=="port"? parseInt(v) :v
        setAlgod(algod =>({ ...algod, [k]: val }))
        setHasChanges(true)
    }

    function setIndexerValue (k: string, v: string){
        const val = k=="port"? parseInt(v) :v
        setIndexer(indexer =>({ ...indexer, [k]: val }))
        setHasChanges(true)
    }

    function setIpfsValue (k: string, v: string){
        setIPFS(ipfs =>({ ...ipfs, [k]: v }))
        setHasChanges(true)
    }

    function setAppConf(k: string, v: string) {
        const val = k=="fee"? parseInt(v) :v
        setApp(appConf =>({ ...appConf, [k]: val }))
        setHasChanges(true)
    }

    function createApp(){
        setLoading(true)

        const app  = new Application(appConf)

        app.create(props.wallet)
        .then((ac)=>{ setApp(appConf=>({...appConf, ...ac})) })
        .finally(()=>{ setLoading(false) })
    }

    function updateApp(){
        setLoading(true)

        const app  = new Application(appConf)

        app.updateApplication(props.wallet)
        .then((result)=>{ })
        .finally(()=>{ setLoading(false) })
    }

    function updateConf(e){
        alert("Ok but this doesnt do anything, so just copy-paste it into your github repo")
        setHasChanges(false)
    }


    let appComponent = <ApplicationCreator set={setAppConf} create={createApp} {...appConf} loading={loading} />
    if (appConf.id>0){
        appComponent = <ApplicationUpdater set={setAppConf} update={updateApp} {...appConf} loading={loading} />
    }

    return (
        <div className='container config-container'>
            <Tabs id='configuration' vertical={true}>
                <Tab title='Algod' id='algod' panel={<Algod setProp={setAlgodValue} {...algod} />} />
                <Tab title='Indexer' id='index' panel={ <Indexer setProp={setIndexerValue} {...indexer} /> } />
                <Tab title='Ipfs' id='ipfs' panel={ <IPFSConfig setProp={setIpfsValue} {...ipfs} /> } />
                <Tab title='App' id='app' panel={ appComponent } />
            </Tabs>
            <div className='container config-text-container'>
                <SyntaxHighlighter language='json' style={docco}>
                    {JSON.stringify({
                        ...ps,
                        ["algod"]: algod,
                        ["indexer"]: indexer,
                        ["ipfs"]: ipfs,
                        ["application"]:appConf
                    }, undefined, 4)}
                </SyntaxHighlighter>
                 <Button text='update' outlined={true} disabled={!hasChanges} onClick={updateConf} />
            </div>
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
    fee: number 
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
                value={props.fee.toString()}
            />
            <Button loading={props.loading} onClick={props.create} text='Create'/>
        </div>
    )
}

type ApplicationUpdaterProps = {
    name: string
    unit: string
    fee: number 
    loading: boolean
    set(key: string, value: string)
    update()
};

function ApplicationUpdater(props: ApplicationUpdaterProps) {

    return (
        <div className='container application-conf' >
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
                value={props.fee.toString()}
            />
            <Button loading={props.loading} onClick={props.update} text='Update Application'/>
        </div>
    )
}