/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import {getToken, destroyToken} from './lib/algorand'
import {getCIDFromMetadataHash, getMetaFromIpfs} from './lib/ipfs'
import {FormGroup, Label, Button, MultistepDialog, DialogStep, Classes, NumericInput} from '@blueprintjs/core'
import listing from './lib/listing.ts'


function RAF() {
    let {id} = useParams();
    let history = useHistory();

    const [md, setMeta] = useState({'img_src':'http://via.placeholder.com/550', 'title':''})
    const [waiting_for_tx, setWaiting] = useState(false)
    const [listingVisible, setListingVisible] = useState(false)
    const [price, setPrice] = useState(0)
    
    useEffect(()=>{
        if(md.title==''){
            getTokenMetadata()
            .then((md)=>{ setMeta({img_src:'http://ipfs.io/ipfs/'+md['file_hash'], title:md['title'], artist:md['artist']}) })
            .catch((err)=>{ console.log("Error:", err) })
        }
    });

    async function getTokenMetadata() {
        const token = await getToken(id)
        const cid = getCIDFromMetadataHash(token['params']['metadata-hash'])
        return await getMetaFromIpfs(cid.toString())
    }


    function handleCreateListing(){ setListingVisible(true) }
    function handleCancelListing(){ setListingVisible(false) }

    async function deleteToken(e){
        setWaiting(true)
        await destroyToken(parseInt(id))
        setWaiting(false)
        history.push("/")
    }

    async function handlePriceChange(price){
        setPrice(price)
    }

    async function handleSubmitListing(){
        setWaiting(true); 

        // call create listing function with arguments 
        // for price/assetid 
        const lst = new listing(price, parseInt(id), this.props.wallet.getDefaultAccount())
        await lst.createListing(this.props.wallet)

        // Wait for it to return
        setWaiting(false);

        // Return addr of created account with contents
        history.push("/listing/"+lst.contract_addr)
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

            <div className='container'>
                <div className='content'>
                    <Button loading={waiting_for_tx} onClick={handleCreateListing} intent='success' icon='application' >Create Listing</Button>
                    <Button loading={waiting_for_tx} onClick={deleteToken} intent='danger' icon='cross' >Delete token</Button>
                </div>
            </div>

            <MultistepDialog isOpen={listingVisible} onClose={handleCancelListing} finalButtonProps={{onClick:handleSubmitListing}} >
                <DialogStep 
                    id="price" 
                    title="price" 
                    panel={<ListingDetails tokenId={id} price={price} onPriceChange={handlePriceChange} ></ListingDetails>}>
                </DialogStep>
                <DialogStep 
                    id="confirm" 
                    title="confirm" 
                    panel={<ConfirmListingDetails tokenId={id} price={price} ></ConfirmListingDetails>} 
                    >
                </DialogStep>
            </MultistepDialog>
        </div>
    )
}


function ListingDetails(props){
    function handlePriceChange(vnum, vstring) {
        props.onPriceChange(vnum)
    }

    return (
        <div className={Classes.DIALOG_BODY}>
            <FormGroup>
                <Label htmlFor="input-price">Price in USD</Label>
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
            <h3>Listing token {props.tokenId} for {props.price}</h3>
        </div>
    )
}

export default RAF