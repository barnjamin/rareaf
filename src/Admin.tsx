/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {Prompt} from 'react-router-dom'

import { Wallet } from 'algorand-session-wallet'
import { platform_settings as ps} from './lib/platform-conf'
import {TagToken} from './lib/tags'
import { Application } from './lib/application';
import { Card, Tag, Button, Tabs, Tab, InputGroup, TagInput, Classes, Elevation } from '@blueprintjs/core'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from  'react-syntax-highlighter/dist/esm/styles/hljs'
import { getTags } from './lib/algorand'
import { showErrorToaster, showInfo } from './Toaster'

type AdminProps = { 
    history: any
    wallet: Wallet
    acct: string
};

export default function Admin(props: AdminProps) {
    if (props.acct != ps.application.admin_addr && ps.application.admin_addr != "")  return (<div className='container'><p>no</p></div>)

    const [algod, setAlgod] = React.useState(ps.algod)
    const [indexer, setIndexer] = React.useState(ps.indexer)
    const [ipfs, setIPFS] = React.useState(ps.ipfs)
    const [loading, setLoading] = React.useState(false)
    const [appConf, setApp] = React.useState(ps.application)
    const [tags, setTags] = React.useState(ps.application.tags)

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
        const val = k=="fee_amt"? parseInt(v) :v
        setApp(appConf =>({ ...appConf, [k]: val }))
    }

    function handleTagAdd(e){
        const tag = new TagToken(e[0])

        //Make sure tag isnt already in array
        if(tags.some((t)=>{return t.name == tag.name})) 
            return showErrorToaster("This tag name already exists")

        showInfo("Creating tag")
        setLoading(true)

        try{
            tag.create(props.wallet)
            .then((id)=>{ setTags(old=>[...old, tag]) })
            .finally(()=>{ setLoading(false) })
        }catch(error){
            console.error("Fail: ", error)
            setLoading(false) 
        }

    }

    function handleTagRemove(e){
        // Create Txn to remove  
        setLoading(true)
        showInfo("Removing tag")

        const tid = parseInt(e.key)
        const tag = tags.find(t=>{return t.id==tid})

        try {
            tag.destroy(props.wallet)
            .then(success=>{ if(success) return setTags(tags.filter(t=>{return t.id!==tid})) })
            .finally(()=>{ setLoading(false) })

        }catch(error){
            console.error("error: ", error)
            setLoading(false)
        }
    }

    function createApp(){
        setLoading(true)

        showInfo("Creating Application")
        const app  = new Application(appConf)

        app.create(props.wallet)
        .then((ac)=>{ setApp(appConf=>({ ...appConf, ...ac })) })
        .finally(()=>{ setLoading(false) })
    }

    function updateApp(){
        setLoading(true)

        showInfo("Updating Application")

        const app  = new Application(appConf)

        app.updateApplication(props.wallet)
        .finally(()=>{ setLoading(false) })
    }

    function destroyApp(){
        setLoading(true)

        const app  = new Application(appConf)
        showInfo("Destroying Application")

        app.destroyApplication(props.wallet)
        .then((ac)=>{setApp(appConf=>({...appConf, ...ac}))})
        .finally(()=>{ setLoading(false) })

    }

    function updateConf(e){
        var blob = new Blob([getConfText()], {type: "application/json"});

        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download =  "config.json";
        link.click();
    }

    function searchForTags(){
        setLoading(true)

        getTags().then((foundTags)=>{ setTags([...foundTags]) })
        .finally(()=>{setLoading(false)})
    }


    let appComponent = <ApplicationCreator 
        set={setAppConf} 
        create={createApp} 
        loading={loading} 
        {...appConf} 
        />

    if (appConf.app_id>0){
        appComponent = <ApplicationUpdater 
            set={setAppConf} 
            update={updateApp} 
            destroy={destroyApp}
            loading={loading} 
            {...appConf} 
        />
    }

    function getConfText() {
        return JSON.stringify({
            ...ps,
            ["algod"]: algod,
            ["indexer"]: indexer,
            ["ipfs"]: ipfs,
            ["application"]:{...appConf, tags:tags},
        }, undefined, 4)
    }

    return (
        <div>
            <div className='container config-container'>
                <Card elevation={Elevation.THREE} >
                    <Tabs id='configuration' vertical={true}>
                        <Tab title='App' id='app' panel={ appComponent } />
                        <Tab title='Algod' id='algod' panel={<Algod setProp={setAlgodValue} {...algod} />} />
                        <Tab title='Indexer' id='index' panel={ <Indexer setProp={setIndexerValue} {...indexer} /> } />
                        <Tab title='Ipfs' id='ipfs' panel={ <IPFSConfig setProp={setIpfsValue} {...ipfs} /> } />
                        <Tab title='Tags' id='tags' panel={ <TagCreator loading={loading} searchForTags={searchForTags} handleAdd={handleTagAdd} handleRemove={handleTagRemove} tags={tags} />} />
                    </Tabs>
                    <div className='container config-text-container'>
                        <SyntaxHighlighter language='json' style={docco} wrapLongLines={true}>
                            {getConfText()}
                        </SyntaxHighlighter>
                        <Button text='Download' minimal={true} outlined={true}  onClick={updateConf} />
                    </div>
                </Card>
            </div>
            <Prompt when={true} message="Changes made to config, have you saved them?" />
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
            <InputGroup fill={true} 
                onChange={setter("server")}
                placeholder="API Server"
                large={true}
                value={props.server} 
            />
            <InputGroup fill={true}
                onChange={setter("port")}
                placeholder="API Port" 
                large={true}
                value={props.port.toString()} 
            />
            <InputGroup  fill={true}
                onChange={setter("token")}
                placeholder="API Token"
                large={true}
                value={props.token} 
            />
            <InputGroup  fill={true}
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
            <InputGroup  fill={true} 
                onChange={setter("server")}
                placeholder="Indexer Server"
                large={true}
                value={props.server} 
            />
            <InputGroup fill={true}
                onChange={setter("port")}
                placeholder="Indexer Port" 
                large={true}
                value={props.port.toString()} 
            />
            <InputGroup  fill={true}
                onChange={setter("token")}
                placeholder="Indexer Token"
                large={true}
                value={props.token} 
            />
        </div>
    )
}

type IPFSConfigProps = {
    display: string 
    token: string
    setProp(key: string, val: string)
}

function IPFSConfig(props: IPFSConfigProps)  {
    const setter = (name: string)=>{ return (e)=>{ props.setProp(name, e.target.value) } }

    return (
        <div className='content indexer-config'>
            <InputGroup fill={true}
                onChange={setter("display")}
                placeholder="nft.storage token" 
                large={true}
                value={props.token} 
            />
            <InputGroup fill={true}
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
    fee_amt: number 
    loading: boolean
    set(key: string, value: string)
    create()
};

function ApplicationCreator(props: ApplicationCreatorProps) {

    return (
        <div className='content application-conf' >
            <InputGroup fill={true}
                onChange={e=>{props.set('name', e.target.value)}}
                placeholder="Application Name"
                large={true}
                value={props.name}
            />
            <InputGroup fill={true}
                onChange={e=>{props.set('unit', e.target.value)}}
                placeholder="Unit Name"
                large={true}
                value={props.unit}
            />
            <InputGroup fill={true}
                onChange={e=>{props.set('fee_amt', e.target.value)}}
                placeholder="Fee"
                large={true}
                value={props.fee_amt.toString()}
            />
            <Button 
            minimal={true} outlined={true}
            loading={props.loading} onClick={props.create} intent='success' text='Create'/>
        </div>
    )
}

type ApplicationUpdaterProps = {
    name: string
    unit: string
    fee_amt: number 
    loading: boolean
    set(key: string, value: string)
    update()
    destroy()
};

function ApplicationUpdater(props: ApplicationUpdaterProps) {

    return (
        <div className='content application-conf' >
            <InputGroup fill={true}
                onChange={e=>{props.set('name', e.target.value)}}
                placeholder="Application Name"
                large={true}
                value={props.name}
            />
            <InputGroup fill={true}
                onChange={e=>{props.set('unit', e.target.value)}}
                placeholder="Unit Name"
                large={true}
                value={props.unit}
            />
            <InputGroup fill={true}
                onChange={e=>{props.set('fee_amt', e.target.value)}}
                placeholder="Fee"
                large={true}
                value={props.fee_amt.toString()}
            />
            <Button 
            minimal={true}
            outlined={true}
            loading={props.loading} onClick={props.update} intent='warning' text='Update Application'/>
            <Button 
            minimal={true}
            outlined={true}
            loading={props.loading} onClick={props.destroy} intent='danger' text='Destroy Application'/>
        </div>
    )
}

type TagCreatorProps ={
    tags: TagToken[]
    loading: boolean
    handleAdd(e)
    handleRemove(e)
    searchForTags(e)
};

function TagCreator(props: TagCreatorProps) {
    return (
        <div>
            <TagInput 
                fill={true}
                className={Classes.FILL}
                onAdd={props.handleAdd}
                onRemove={props.handleRemove}
                placeholder='Add listing tags...'
                values={props.tags.map(t=>{ return <Tag key={t.id}>{t.name}</Tag> })}
            />
            <Button minimal={true} outlined={true} 
            loading={props.loading} onClick={props.searchForTags} text='Recover tags'></Button>
        </div>
    )
}