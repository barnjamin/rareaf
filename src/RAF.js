/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {useParams} from 'react-router-dom'
import {getTokenMetadata} from './algorand'

function RAF() {
    let {id} = useParams();
    const [md, setState] = useState({'img_src':'http://via.placeholder.com/550', 'title':''})
    

    if(md['title'] === ''){
        getTokenMetadata(parseInt(id)).then((md) =>{
            setState({img_src:'http://ipfs.io/ipfs/'+md['file_hash'], title:md['title']})
        }).catch((err)=>{console.error("Failed to get metadata:", err)})
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
        </div>
    )
}

export default RAF