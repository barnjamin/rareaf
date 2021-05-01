/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import {getDetailsOfListing, getTokensFromListingAddress} from './lib/algorand'
import {Button} from '@blueprintjs/core'
import {getCIDFromMetadataHash, getMetaFromIpfs} from './lib/ipfs'

function Listing() {
    const {addr} = useParams();
    const [listing, setListingData] = useState({tokenId: 0, metaHash:''});
    const [md, setMetadata] = useState({img_src:'', artist:'', title:''})
    const [price, setPrice] = useState(0);

    useEffect(()=>{
        if(listing.tokenId==0){
            getTokensFromListingAddress(addr).then((tokens)=>{
                if(tokens.length > 0) {
                    const token = tokens[0]
                    const mhash = getCIDFromMetadataHash(token.params['metadata-hash']).toString()
                    setListingData({
                        tokenId:token.index, 
                        metaHash:mhash
                    })
                    getMetaFromIpfs(mhash).then((md)=>{
                        setMetadata({
                            img_src:'http://ipfs.io/ipfs/'+md['file_hash'],
                            artist: md['artist'],
                            title: md['title'],
                        })
                    })

                }
            })
        }

        if(price==0){
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
                <p>TokenId: {listing.tokenId}</p>
                <p>Price: {price}</p>
            </div>

            <div>
                <Button onClick={handleBuy}>Buy</Button>
            </div>

        </div>
    )

}

export default Listing;