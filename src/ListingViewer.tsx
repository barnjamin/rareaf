/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import { useParams, useHistory } from 'react-router-dom'
import { getListing, getTags } from './lib/algorand'
import { Button, NumericInput, Card, Elevation } from '@blueprintjs/core'
import Tagger from './Tagger'
import {TagToken} from './lib/tags'
import {Wallet} from './wallets/wallet'

type ListingViewerProps = {
    history: any
    acct: string
    wallet: Wallet
};

function ListingViewer(props: ListingViewerProps) {

    const history = useHistory();

    const {addr} = useParams();
    const [tagOpts, setTagOpts] = React.useState(undefined);
    const [listing, setListing] = React.useState(undefined);
    const [loading, setLoading] = React.useState(false);
    const [price, setPrice]     = React.useState(0);
    const [updateable, setUpdateable] = React.useState(false)

    React.useEffect(()=>{
        getTags().then((tags)=>{ setTagOpts(tags) })
        getListing(addr).then((listing)=>{ setListing(listing) })
    }, [])

    async function handleCancelListing(){
        setLoading(true)
        await listing.doDelete(props.wallet)
        history.push("/nft/"+listing.asset_id)
        setLoading(false)
    }

    async function handleBuy(){
        setLoading(true)
        await listing.doPurchase(props.wallet)
        history.push("/nft/"+listing.asset_id)
        setLoading(false)
    }

    async function handleAddTag(tag: TagToken){
        setLoading(true)
        await listing.doTag(props.wallet, tag)
        setLoading(false)
    }

    async function handleRemoveTag(tag: TagToken){
        setLoading(true)
        await listing.doUntag(props.wallet, tag)
        setLoading(false)
    }

    async function checkSetPrice(price: number){
        setPrice(price)

        if(price==listing.price) setUpdateable(false)
        else setUpdateable(true)
    }
    async function handleUpdatePrice(){
        setLoading(true)
        if (price == 0){ 
            alert("You didnt change the price g")
            setLoading(false)
            return
        }
        await listing.doPriceChange(props.wallet, price)
        setLoading(false)
    }


    if(listing !== undefined) {
        let tagsComponent =<Tagger 
                            tagOpts={tagOpts} 
                            tags={listing.tags} 
                            handleAddTag={handleAddTag}
                            handleRemoveTag={handleRemoveTag}
                            renderProps={{"fill": false, "disabled":true}}
                            />
        let buttons = <Button loading={loading} onClick={handleBuy}>Buy</Button>
        let priceComponent = (
            <div className='container listing-price' >
                <p>{listing.price}</p>
            </div>
        )

        if (listing.creator_addr == props.wallet.getDefaultAccount()){
            tagsComponent = (
                <Tagger 
                    tagOpts={tagOpts} 
                    tags={listing.tags} 
                    handleAddTag={handleAddTag}
                    handleRemoveTag={handleRemoveTag}
                    renderProps={{"fill": false, "disabled":false}}
                    />
            )

            priceComponent = (
                <div className='container listing-price-edit'>
                    <NumericInput 
                        onValueChange={checkSetPrice}
                        defaultValue={listing.price} 
                        min={1} 
                        max={10000} 
                        buttonPosition={"none"} 
                    />
                    <Button 
                        loading={loading} 
                        intent="none" 
                        onClick={handleUpdatePrice} 
                        disabled={!updateable}
                        text='Reprice' />
                </div>
            )

            buttons = (
                <div>
                    <Button loading={loading} intent="warning" onClick={handleCancelListing} text='Cancel Listing' />
                </div>
            )
        }

        const deets = listing.nft.metadata
        return (
            <div className='container listing-page'>
                <Card elevation={Elevation.TWO}>
                    <div className='content nft-viewer' >
                        <img className='content-img' src={listing.nft.imgSrc()} />
                    </div>

                    <div className='container nft-details' >
                        <div className='nft-name'>
                            <p><b>{deets.title}</b> - <i>{deets.artist}</i></p>
                        </div>
                        <div className='nft-id' >
                            <p><a href={listing.nft.explorerSrc()}><b>{listing.asset_id}</b></a></p>
                        </div>
                    </div>
                    <div className='container listing-description'>
                        <p>{deets.description}</p>
                    </div>

                    <div className='container listing-actions' >
                        <div className='listing-tags'>
                            { tagsComponent }
                        </div>
                        <div className='container listing-buy'>
                            {priceComponent}
                            <div className='listing-buttons'>
                                { buttons }
                            </div>
                        </div>
                    </div>

                </Card>
            </div>

        )
    }

    return ( <div className='container'></div> )
}

export default ListingViewer;