/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import { getListing } from './lib/algorand'
import {Button} from '@blueprintjs/core'
import { resolveMetadataFromMetaHash } from './lib/ipfs'
import Listing from './lib/listing.ts'
import NFT from './lib/nft'

function ListingViewer() {

    const {addr} = useParams();
    const [listing, setListing] = useState(undefined);
    const [md, setMetadata] = useState({img_src:'', artist:'', title:''})
    const [price, setPrice] = useState(0);

    useEffect(()=>{
        if(listing === undefined){
            getListing(addr).then((listing)=>{ setListing(listing) })
        }
    })

    function handleBuy(e){
        // Create appropriate transactions 
        console.log("buyme")
    }

    if(listing !== undefined){
        return (
            <div className='container'>

                <div className='content content-viewer' >
                    <img className='content-img' src={listing.nft.imgSrc()} />
                </div>

                <div className='container' >
                    <div className='content'>
                        <p><b>{md.title}</b> - <i>{listing.nft.artist}</i></p>
                    </div>
                </div>

                <div className='container listing-details'>
                    <div className='content'>
                        <p>TokenId: {listing.asset_id}</p>
                        <p>Price: {listing.price}</p>
                    </div>
                </div>

                <div>
                    <Button onClick={handleBuy}>Buy</Button>
                </div>
            </div>

        )
    }
    return (
        <div className='container'></div>
    )

}

export default ListingViewer;