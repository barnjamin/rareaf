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

    async function handleCancelListing(e){
        setLoading(true)
        await listing.doDelete(props.wallet)
        history.push("/"+listing.asset_id)
        setLoading(false)
    }

    async function handleBuy(e){
        setLoading(true)
        await listing.doPurchase(props.wallet)
        history.push("/nft/"+listing.asset_id)
        setLoading(false)
    }

    async function handleAddTag(tag){
        setLoading(true)
        await listing.doTag(props.wallet, tag)
        setLoading(false)
    }

    async function handleRemoveTag(tag){
        setLoading(true)
        await listing.doUntag(props.wallet, tag)
        setLoading(false)
    }


    if(listing !== undefined) {

        let tagsComponent = <div />
        let buttons = <Button loading={loading} onClick={handleBuy}>Buy</Button>
        if (listing.creator_addr == props.acct){
            tagsComponent = (
                <Tagger 
                    tagOpts={tagOpts} 
                    handleAddTag={handleAddTag} 
                    handleRemoveTag={handleRemoveTag} 
                    listing={listing} 
                    />
            )

            buttons = <Button loading={loading} onClick={handleCancelListing}>Cancel Listing</Button>
        }

        return (
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
                    { tagsComponent }
                </div>

                <div>
                    { buttons }
                </div>
            </div>

        )
    }

    return ( <div className='container'></div> )
}

export default ListingViewer;