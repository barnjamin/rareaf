/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import { useParams, useHistory } from 'react-router-dom'
import { getListing, getTags } from './lib/algorand'
import { Button, NumericInput } from '@blueprintjs/core'
import Tagger from './Tagger'

import Listing from './lib/listing'
import Wallet from './wallets/wallet'

type ListingViewerProps = {
    listing: Listing
    wallet: Wallet
};

function ListingViewer(props: ListingViewerProps) {

    const history = useHistory();

    const {addr} = useParams();
    const [tagOpts, setTagOpts] = React.useState(undefined);
    const [listing, setListing] = React.useState(undefined);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(()=>{
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

    async function handlePriceChange(price) {
        setLoading(true)
        await listing.doPriceChange(props.wallet, price)
        setLoading(false)
    }


    if(listing !== undefined) {

        let tagsComponent = <div />
        let buttons = <Button loading={loading} onClick={handleBuy}>Buy</Button>
        let priceChange = <div />

        if (listing.creator_addr == props.acct){
            tagsComponent = (
                <Tagger 
                    tagOpts={tagOpts} 
                    handleAddTag={handleAddTag} 
                    handleRemoveTag={handleRemoveTag} 
                    listing={listing} 
                    />
            )
            priceChange = <NumericInput onValueChange={handlePriceChange} defaultValue={listing.price} min={1} max={10000}  ></NumericInput>

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
                    {priceChange}
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