/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import {getToken, destroyToken} from './lib/algorand'
import {getCIDFromMetadataHash, getMetaFromIpfs} from './lib/ipfs'
import {FormGroup, Label, Button, MultistepDialog, DialogStep, Classes, NumericInput} from '@blueprintjs/core'


function RAF() {
    let {id} = useParams();
    let history = useHistory();

    const [md, setMeta] = useState({'img_src':'http://via.placeholder.com/550', 'title':''})
    const [waiting_for_tx, setWaiting] = useState(false)
    const [listingVisible, setListingVisible] = useState(false)
    
    if(md.title==''){
        getTokenMetadata()
        .then((md)=>{ setMeta({img_src:'http://ipfs.io/ipfs/'+md['file_hash'], title:md['title'], artist:md['artist']}) })
        .catch((err)=>{ console.log("Error:", err) })
    }

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

            <Button loading={waiting_for_tx} onClick={handleCreateListing} intent='success' icon='application' >Create Listing</Button>
            <Button loading={waiting_for_tx} onClick={deleteToken} intent='danger' icon='cross' >Delete token</Button>

            <MultistepDialog isOpen={listingVisible} onClose={handleCancelListing}>
                <DialogStep id="price" title="price" panel={<ListingDetails></ListingDetails>}>
                </DialogStep>
                <DialogStep id="confirm" title="confirm" panel={<ConfirmListingDetails></ConfirmListingDetails>} >
                </DialogStep>
            </MultistepDialog>
        </div>
    )
}


function ListingDetails(){
    const [price, setPrice] = useState(0)
    function handlePriceChange(vnum, vstring) {
        setPrice(vnum)
    }

    return (
        <div className={Classes.DIALOG_BODY}>
            <FormGroup>
                <Label htmlFor="input-price">Price</Label>
                <NumericInput buttonPosition="none" min={0} large={true} 
                    id="input-price" value={price} 
                    onValueChange={handlePriceChange} ></NumericInput>
            </FormGroup>
        </div>
    )
}

function ConfirmListingDetails(){
    return (
        <div className={Classes.DIALOG_BODY}>
            <p>ok</p>
        </div>
    )
}

export default RAF