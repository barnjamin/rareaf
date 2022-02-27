/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams, useHistory} from 'react-router-dom'
import { tryGetNFT, isOptedIntoApp, getListingAddr } from './lib/algorand'
import {Tag, Card, FormGroup, Label, Button, MultistepDialog, DialogStep, Classes, NumericInput, Elevation, HTMLSelect} from '@blueprintjs/core'
import Listing from './lib/listing'
import {Wallet} from 'algorand-session-wallet'
import {NFT} from './lib/nft'
import {Tagger, MAX_LISTING_TAGS } from './Tagger'
import {Application} from './lib/application'
import {platform_settings as ps} from './lib/platform-conf'
import { showErrorToaster, showInfo } from './Toaster'
import { ApplicationConfiguration } from './lib/application-configuration'
import { PriceToken } from './lib/price'
import { TagToken } from './lib/tags'

type NFTViewerProps = {
    history: any
    wallet: Wallet
    acct: string
    ac: ApplicationConfiguration
}

export default function NFTViewer(props: NFTViewerProps) {
    let {id} = useParams();
    let history = useHistory();

    const [nft, setNFT]                = React.useState(NFT.emptyNFT())

    const [waiting_for_tx, setWaiting]        = React.useState(false)
    const [price, setPrice]                   = React.useState(0)
    const [displayPrice, setDisplayPrice]     = React.useState("")
    const [priceToken, setPriceToken]         = React.useState(undefined)
    const [listingVisible, setListingVisible] = React.useState(false)
    const [tags, setTags]                     = React.useState([])
    const [optedIn, setOptedIn]               = React.useState(false)
    const [listingAddr, setListingAddr]       = React.useState("")
    
    React.useEffect(()=>{
        if(priceToken == undefined && props.ac.price_ids && props.ac.price_ids.length>0) 
            setPriceToken(props.ac.price_ids[0])
    }, [props.ac])

    React.useEffect(()=>{
        let subscribed = true

        tryGetNFT(parseInt(id))
            .then((nft)=>{  if(subscribed) setNFT(nft) })
            .catch((err)=>{ showErrorToaster("Couldn't find this asset: "+err) })

        return ()=>{subscribed=false}
    }, []);

    React.useEffect(()=>{
        let subscribed = true

        getListingAddr(props.ac, parseInt(id))
            .then((addr)=>{  if(subscribed) setListingAddr(addr) })
            .catch((err)=>{ console.error("Couldn't check to see if this NFT is listed: ", err) })

        return ()=>{subscribed=false}
    }, [props.ac]);

    React.useEffect(()=>{
        if(props.wallet === undefined) return

        let subscribed = true

        isOptedIntoApp(props.ac, props.acct)
            .then((oi)=>{ if(subscribed) setOptedIn(oi) })
            .catch((err)=>{ console.error("Couldnt check to see if acct is opted in: ", err) })

        return ()=>{subscribed=false}
    }, [props.ac, props.acct])


    function handleCreateListing(){ setListingVisible(true) }
    function handleCancelListing(){ setListingVisible(false) }

    async function deleteToken(e){
        setWaiting(true)

        try {
            await nft.destroyToken(props.wallet)
            history.push("/")
        } catch (error) { showErrorToaster("Couldn't destroy token") }

        setWaiting(false)
    }

    async function handlePriceChange(price: string){ 
        setPrice(PriceToken.toUnits(priceToken, parseFloat(price)))

        if(price.includes(".")){
            const chunks = price.split(".")
            if(chunks.length>1 && chunks[1].length>priceToken.asa.decimals){
                price = chunks[0] + "." + chunks[1].slice(0, priceToken.asa.decimals)
            }
        }

        setDisplayPrice(price) 
    }
    async function handlePriceTokenChange(pt: PriceToken){ setPriceToken(pt) }

    async function handleSubmitListing(){
        setWaiting(true); 

        try{
            showInfo("Creating listing transaction")
            const lst = new Listing(price, priceToken.id, parseInt(id), props.acct, props.ac)

            await lst.doCreate(props.wallet)

            if(tags.length > 0 ){
                showInfo("Adding tags")
                await lst.doTags(props.wallet, tags)
            }

            await lst.doPriceChange(props.wallet, price)

            history.push("/listing/"+lst.contract_addr)

        }catch(error){ 
            showErrorToaster("Failed to create listing: "+error.toString())
        }

        setWaiting(false);
    }


    let editButtons = <div />

    if(listingAddr == "" && props.wallet !== undefined && nft !== undefined && nft.manager === props.wallet.getDefaultAccount()){
        editButtons = (
            <div className='container-right'>
                <div className='content'>
                    <Button loading={waiting_for_tx} onClick={handleCreateListing} intent='success' icon='tag' >Create Listing</Button>
                    <Button loading={waiting_for_tx} onClick={deleteToken} intent='danger' icon='cross' >Delete token</Button>
                </div>
            </div>
        )
    }

    const listing_link = listingAddr !== ""?(
        <p>This NFT is listed <a href={ps.domain+"listing/"+listingAddr}><b>here</b></a></p>
    ):<p></p>

    return (
        <div className='container nft-display' >
            <Card  elevation={Elevation.TWO} className='nft-card' >
                <div className='content nft-image'>
                    <img src={nft.imgSrc()} />
                </div>

                <div className='container nft-details' >
                    <div className='nft-name'>
                        <p><b>{nft.metadata.name}</b> - <i>{nft.metadata.properties.artist}</i></p>
                    </div>
                    <div className='nft-token-id' >
                        <p><a href={nft.explorerSrc()}><b>{nft.asset_id}</b></a></p>
                    </div>
                </div>

                <div className='container nft-description'>
                    <p> { nft.metadata.description }</p>
                </div>

                { editButtons }

                <div className='container'>
                    {listing_link}
                </div>
            </Card>


            <MultistepDialog isOpen={listingVisible} onClose={handleCancelListing} finalButtonProps={{loading: waiting_for_tx, onClick:handleSubmitListing}} >
                <DialogStep 
                    id="price" 
                    title="price" 
                    panel={<PricingDetails 
                        price={displayPrice} 
                        priceToken={priceToken} 
                        priceTokenOptions={props.ac.price_ids}
                        onPriceChange={handlePriceChange} 
                        onPriceTokenChange={handlePriceTokenChange} 
                    />}>
                </DialogStep>
                <DialogStep 
                    id="tags" 
                    title="tags" 
                    panel={
                        <div className={Classes.DIALOG_BODY}>
                            <Tagger 
                                renderProps={{"fill":true}} 
                                tags={tags} 
                                tagOpts={props.ac.tags} 
                                setTags={setTags}
                                maxTags={MAX_LISTING_TAGS}
                                />
                        </div>
                    } />
                <DialogStep 
                    id="confirm" 
                    title="confirm" 
                    panel={<ConfirmListingDetails 
                        tokenId={nft.asset_id} 
                        price={displayPrice} 
                        priceToken={priceToken}
                        tags={tags} 
                        />} 
                    >
                </DialogStep>
            </MultistepDialog>
        </div>
    )
}

type PricingDetailsProps= {
    price: string 
    priceToken:  PriceToken 
    priceTokenOptions: PriceToken[]
    onPriceTokenChange(PriceToken)
    onPriceChange(string)
}

function PricingDetails(props: PricingDetailsProps){

    function handlePriceTokenSelect(e){
        const id = parseInt(e.currentTarget.value)
        const pt = props.priceTokenOptions.find((pt)=>{ return pt.id == id})
        props.onPriceTokenChange(pt)
    }

    function handlePriceChange(vnum: number, vstring: string) {
        props.onPriceChange(vstring)
    }
    
    const opts = props.priceTokenOptions.map((pt)=>{
        return {label:pt.asa.name, value:pt.id}
    })

    return (
        <div className={Classes.DIALOG_BODY}>
            <FormGroup>
                <Label >Price in: 
                    <HTMLSelect id="price-token" options={opts} onChange={handlePriceTokenSelect} />
                </Label>
                <NumericInput 
                    buttonPosition="none" 
                    min={0} 
                    fill={true}
                    id="input-price" value={props.price} 
                    allowNumericCharactersOnly={false}
                    onValueChange={handlePriceChange} />
            </FormGroup>
        </div>
    )
}

type ListingDetailsProps = {
    tokenId: number
    price: string 
    priceToken: PriceToken
    tags: TagToken[]
}

function ConfirmListingDetails(props: ListingDetailsProps){
    return (
        <div className={Classes.DIALOG_BODY}>
            <h3>Listing:</h3>

            <p><b>Token:</b> {props.tokenId} </p>
            <p><b>Price:</b> {props.price} {props.priceToken.asa.unitName}</p> 
            <p><b>Tags:</b> {props.tags.map(t=>{return <Tag key={t.id} round={true} intent='primary'>{t.name}</Tag>})}</p>
        </div>
    )
}
