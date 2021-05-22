/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'
import { useParams, useHistory} from 'react-router-dom'
import { getListing } from './lib/algorand'
import {Button} from '@blueprintjs/core'

function ListingViewer(props) {

    const {addr} = useParams();
    const [listing, setListing] = useState(undefined);
    const [loading, setLoading] = useState(false);

    useEffect(()=>{
        if(listing === undefined)
            getListing(addr).then((listing)=>{ setListing(listing) })
    })

    function handleCancelListing(e){
        setLoading(true)
        listing.destroyListing(props.wallet)
        setLoading(false)
    }
    function handleBuy(e){
        setLoading(true)
        listing.purchaseListing(props.wallet)
        setLoading(false)
    }

    if(listing !== undefined) return (
            <div className='container'>

                <div className='content content-viewer' >
                    <img className='content-img' src={listing.nft.imgSrc()} />
                </div>

                <div className='container' >
                    <div className='content'>
                        <p><b>{listing.nft.title}</b> - <i>{listing.nft.artist}</i></p>
                    </div>
                </div>

                <div className='container listing-details'>
                    <div className='content'>
                        <p>TokenId: {listing.asset_id}</p>
                        <p>Price: {listing.price}</p>
                    </div>
                </div>

                <div>
                    <Button loading={loading} onClick={handleBuy}>Buy</Button>
                    <Button loading={loading} onClick={handleCancelListing}>Cancel Listing</Button>
                </div>
            </div>

        )
    return (
        <div className='container'></div>
    )

}

export default ListingViewer;