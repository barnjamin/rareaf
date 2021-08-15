/* eslint-disable no-console */
'use strict'

import * as React from 'react'

import {Transaction} from 'algosdk'
import { useParams, useHistory } from 'react-router-dom'
import { AnchorButton, Button, NumericInput, Card, Elevation } from '@blueprintjs/core'

import { 
    getListing, 
    getSuggested, 
    isOptedIntoAsset, 
    sendWait 
} from './lib/algorand'
import {
get_asa_optin_txn
} from './lib/transactions'
import {platform_settings as ps} from './lib/platform-conf'
import {Wallet} from 'algorand-session-wallet'
import {TagToken} from './lib/tags'
import { MAX_LISTING_TAGS, Tagger} from './Tagger'
import { showErrorToaster } from './Toaster'

type ListingViewerProps = {
    history: any
    acct: string
    wallet: Wallet
};


function ListingViewer(props: ListingViewerProps) {

    const history = useHistory();

    const {addr} = useParams();
    const [listing, setListing] = React.useState(undefined);
    const [loading, setLoading] = React.useState(false);
    const [price, setPrice]     = React.useState(0);
    const [updateable, setUpdateable] = React.useState(false)

    React.useEffect(()=>{ getListing(addr).then((listing)=>{ setListing(listing) }) }, [])

    async function handleCancelListing(){
        setLoading(true)
        if(await listing.doDelete(props.wallet)) {
            return history.push("/nft/"+listing.asset_id)
        }
        showErrorToaster("Couldn't cancel listing") 
        setLoading(false)
    }


    async function handleOptIntoAsset(){

        if(props.wallet === undefined) return 

        const addr = props.wallet.getDefaultAccount()

        if(await isOptedIntoAsset(addr, listing.asset_id)) return

        const suggested = await getSuggested(10)
        const optin = new Transaction(get_asa_optin_txn(suggested, addr, listing.asset_id))

        const [signed] = await props.wallet.signTxn([optin])

        const result = await sendWait([signed])
    }

    async function handleBuy(){
        setLoading(true)
        await handleOptIntoAsset()

        if(await listing.doPurchase(props.wallet)){
            return history.push("/nft/"+listing.asset_id)
        }

        showErrorToaster("Failed to complete purchase")
        setLoading(false)
    }

    async function handleAddTag(tag: TagToken){
        setLoading(true)

        if(listing.tags.length<MAX_LISTING_TAGS) {
            await listing.doTag(props.wallet, tag)
            setListing(listing)
        }else{
            showErrorToaster("Can't apply > " + MAX_LISTING_TAGS + " tags")
        }

        setLoading(false)
    }

    async function handleRemoveTag(tag: TagToken){
        setLoading(true)
        await listing.doUntag(props.wallet, tag)
        setListing(listing)
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
            showErrorToaster("Price not changed")
            setLoading(false)
            return
        }

        await listing.doPriceChange(props.wallet, price)
        setListing(listing)
        setLoading(false)
    }


    if(listing !== undefined) {
        let tagsComponent = <div className='container listing-card-tags'>
            {
                listing.tags.map((t)=>{
                    return <AnchorButton 
                        key={t.id} 
                        large={true}
                        minimal={true}
                        outlined={true}
                        href={'/tag/'+ t.name} 
                        text={t.name} 
                    />
                })
            } 
        </div>

        let buttons = <Button loading={loading} disabled={props.wallet===undefined} onClick={handleBuy}>Buy</Button>

        let priceComponent = (
            <div className='container listing-price' >
                <p>{listing.price} μAlgos</p>
            </div>
        )

        if (props.wallet !== undefined && listing.creator_addr == props.wallet.getDefaultAccount()){
            tagsComponent = (
                <Tagger 
                    tagOpts={ps.application.tags} 
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
                    <div className='content nft-image' >
                        <img className='content-img' src={listing.nft.imgSrc()} />
                    </div>

                    <div className='container nft-details' >
                        <div className='nft-name'>
                            <p><b>{deets.name}</b> - <i>{deets.properties.artist}</i></p>
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