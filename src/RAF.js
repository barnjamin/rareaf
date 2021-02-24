/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {useParams} from 'react-router-dom'
import {getTokenMetadata, destroyToken} from './algorand'
import {Button} from '@blueprintjs/core'


function RAF() {
    let {id} = useParams();
    const [md, setState] = useState({'img_src':'http://via.placeholder.com/550', 'title':''})
    

    if(md['title'] === ''){
        getTokenMetadata(parseInt(id)).then((md) =>{
            console.log(md)
            setState({img_src:'http://ipfs.io/ipfs/'+md['file_hash'], title:md['title']})
        }).catch((err)=>{console.error("Failed to get metadata:", err)})
    }


    function deleteToken(e){
        destroyToken(parseInt(id))
    }


    return (
        <div className='container'>
            <div className='content content-viewer' >
                <img className='content-img' src={md.img_src} />
            </div>
            <div className='container' >
                <div className='content'>
                    <h3><b>{md.title}</b></h3>
                </div>
            </div>
            <Button onClick={deleteToken} >Delete token</Button>
        </div>
    )
}

export default RAF