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
import { Pricer } from './Pricer'

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
    const [priceToken, setPriceToken]         = React.useState(undefined)
    const [listingVisible, setListingVisible] = React.useState(false)
    const [tags, setTags]                     = React.useState([])
    const [optedIn, setOptedIn]               = React.useState(false)
    const [listingAddr, setListingAddr]       = React.useState("")
    
    React.useEffect(()=>{
        let subscribed = true
        if(priceToken == undefined && props.ac.price_ids && props.ac.price_ids.length>0) 
            setPriceToken(props.ac.price_ids[0])

        return ()=>{subscribed=false}
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

    async function handlePriceChange(price: number){ setPrice(price) }
    async function handlePriceTokenChange(pt: PriceToken){ 
        console.log(pt)
        setPriceToken(pt) 
    }

    async function handleOptIn(): Promise<boolean> {
        if(props.wallet === undefined || optedIn) return false

        showInfo("Creating Transaction to Opt-In to application")

        const app = new Application(props.ac)
        try {
            await app.optIn(props.wallet) 
            return true
        }catch(error){
            showErrorToaster("Failed to opt into Application: "+error.toString())
        }
        return false 
    }

    async function handleSubmitListing(){
        setWaiting(true); 

        try{
            await handleOptIn()


            showInfo("Creating listing transaction")
            const lst = new Listing(price, priceToken.id, parseInt(id), props.acct, props.ac)

            console.log(lst)
               // Trigger popup to get event for signing 
            await lst.doCreate(props.wallet)

            if(tags.length > 0 ){
                showInfo("Adding tags")
                await lst.doTags(props.wallet, tags)
            }

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
                        price={price} 
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
                    panel={<ConfirmListingDetails tokenId={nft.asset_id} price={price} tags={tags} />} 
                    >
                </DialogStep>
            </MultistepDialog>
        </div>
    )
}

type PricingDetailsProps= {
    price: number
    priceToken:  PriceToken 
    priceTokenOptions: PriceToken[]
    onPriceTokenChange(PriceToken)
    onPriceChange(number)
}

function PricingDetails(props: PricingDetailsProps){

    function handlePriceTokenSelect(e){
        const id = parseInt(e.currentTarget.value)
        const pt = props.priceTokenOptions.find((pt)=>{ return pt.id == id})
        props.onPriceTokenChange(pt)
    }
    function handlePriceChange(vnum) {
        props.onPriceChange(vnum)
    }
    
    const opts = props.priceTokenOptions.map((pt)=>{
        return {label:pt.asa.name, value:pt.id}
    })

    const price_units = props.priceToken?props.priceToken.asa.unitName:""

    return (
        <div className={Classes.DIALOG_BODY}>
            <FormGroup>
                <HTMLSelect options={opts} onChange={handlePriceTokenSelect} />
                <Label htmlFor="input-price">Price  in {price_units}</Label>
                <NumericInput buttonPosition="none" 
                    min={0} large={true} 
                    id="input-price" value={props.price} 
                    onValueChange={handlePriceChange} ></NumericInput>
            </FormGroup>
        </div>
    )
}

function ConfirmListingDetails(props){
    return (
        <div className={Classes.DIALOG_BODY}>
            <h3>Listing:</h3>

            <p><b>Token:</b> {props.tokenId} </p>
            <p><b>Price:</b> {props.price} μAlgos</p> 
            <p><b>Tags:</b> {props.tags.map(t=>{return <Tag key={t.id} round={true} intent='primary'>{t.name}</Tag>})}</p>
        </div>
    )
}
