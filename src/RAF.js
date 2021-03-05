/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import {getToken, destroyToken} from './algorand'
import {getCIDFromMetadataHash, getMetaFromIpfs} from './ipfs'
import {Button} from '@blueprintjs/core'


function RAF() {
    let {id} = useParams();
    let history = useHistory();

    const [md, setMeta] = useState({'img_src':'http://via.placeholder.com/550', 'title':''})
    const [waiting_for_tx, setWaiting] = useState(false)
    
    if(md.title==''){
        getTokenMetadata()
        .then((md)=>{ setMeta({img_src:'http://ipfs.io/ipfs/'+md['file_hash'], title:md['title'], artist:md['artist']}) })
        .catch((err)=>{ console.log("Error:", err) })
    }

    async function getTokenMetadata() {
        const token = await getToken(id)
        const cid = getCIDFromMetadataHash(token['params']['metadata-hash'])
        const md = await getMetaFromIpfs(cid.toString())
        return md
    }

    async function deleteToken(e){
        setWaiting(true)
        await destroyToken(parseInt(id))
        setWaiting(false)
        history.push("/")
    }

    return (
        <div className='container'>
            <div className='content content-viewer' >
                <img className='content-img' src={md.img_src} />
            </div>
            <div className='container' >
                <div className='content'>
                    <p><b>{md.title}</b> - <i>{md.artist}</i></p>
                </div>
            </div>
            <Button loading={waiting_for_tx} onClick={deleteToken} intent='danger' icon='cross' >Delete token</Button>
        </div>
    )
}

export default RAF