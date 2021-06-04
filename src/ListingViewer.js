/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'

import { useParams, useHistory } from 'react-router-dom'
import { getListing, getTags } from './lib/algorand'
import { Button } from '@blueprintjs/core'
import Tagger from './Tagger'


function ListingViewer(props) {

    const history = useHistory();

    const {addr} = useParams();
    const [tagOpts, setTagOpts] = useState(undefined);
    const [listing, setListing] = useState(undefined);
    const [loading, setLoading] = useState(false);

    useEffect(()=>{
        getTags().then((tags)=>{ setTagOpts(tags) })
        getListing(addr).then((listing)=>{ setListing(listing) })
    }, [])

    function handleCancelListing(e){
        setLoading(true)
        listing.doDelete(props.wallet)
        setLoading(false)
    }

    function handleBuy(e){
        setLoading(true)
        listing.doPurchase(props.wallet)
        setLoading(false)
    }

    function handleTag(tag){
        setLoading(true)
        listing.doTag(props.wallet, tag)
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
                    <Tagger tagOpts={tagOpts} handleTag={handleTag} listing={listing} ></Tagger>
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