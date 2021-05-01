/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import {getDetailsOfListing, getTokensFromListingAddress} from './lib/algorand'
import {Button} from '@blueprintjs/core'
import {getCIDFromMetadataHash, getMetaFromIpfs, resolveMetadataFromMetaHash} from './lib/ipfs'

function Listing() {
    const {addr} = useParams();
    const [token, setToken] = useState({});
    const [md, setMetadata] = useState({img_src:'', artist:'', title:''})
    const [price, setPrice] = useState(0);

    useEffect(()=>{
        if(token.index === undefined){
            getTokensFromListingAddress(addr).then((tokens)=>{
                if(tokens.length > 0) {
                    const token = tokens[0]
                    setToken(token)
                    
                    resolveMetadataFromMetaHash(token['params']['metadata-hash']).then((md)=>{
                        setMetadata(md)
                    })
                }
            })
            
            getDetailsOfListing(addr).then((details)=>{ setPrice(details[0]) })
        }

    })

    function handleBuy(e){
        // Create appropriate transactions 
        console.log("buyme")
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

            <div className='container listing-details'>
                <div className='content'>
                    <p>TokenId: {token.index}</p>
                    <p>Price: {price}</p>
                </div>
            </div>

            <div>
                <Button onClick={handleBuy}>Buy</Button>
            </div>
        </div>
    )

}

export default Listing;