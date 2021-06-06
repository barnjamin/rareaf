/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams, useHistory} from 'react-router-dom'
import { getNFT } from './lib/algorand'
import {Card, FormGroup, Label, Button, MultistepDialog, DialogStep, Classes, NumericInput, Elevation} from '@blueprintjs/core'
import listing from './lib/listing'
import {Wallet} from './wallets/wallet'
import NFT from './lib/nft'

type NFTViewerProps = {
    wallet: Wallet
}

function NFTViewer(props: NFTViewerProps) {
    let {id} = useParams();
    let history = useHistory();

    const [nft, setNFT]                = React.useState(NFT.emptyNFT())

    const [waiting_for_tx, setWaiting]        = React.useState(false)
    const [price, setPrice]                   = React.useState(0)
    const [listingVisible, setListingVisible] = React.useState(false)
    
    React.useEffect(()=>{
        getNFT(parseInt(id))
            .then((nft)=>{ setNFT(nft) })
            .catch((err)=>{ console.log("Error:", err) })
    }, []);


    function handleCreateListing(){ setListingVisible(true) }
    function handleCancelListing(){ setListingVisible(false) }

    async function deleteToken(e){
        setWaiting(true)

        try {
            await nft.destroyToken(props.wallet)
            history.push("/")
        } catch (error) {
            console.error(error) 
        }

        setWaiting(false)
    }

    async function handlePriceChange(price){
        setPrice(price)
    }

    async function handleSubmitListing(){
        setWaiting(true); 

        // call create listing function with arguments 
        // for price/assetid 
        try{
            const lst = new listing(price, parseInt(id), props.wallet.getDefaultAccount())
            await lst.doCreate(props.wallet)
            // Return addr of created account with contents
            history.push("/listing/"+lst.contract_addr)
        }catch(error){
            console.log(error)
        }

        // Wait for it to return
        setWaiting(false);

    }
    let editButtons = <div />
    if(nft.manager === props.acct){
        editButtons = (
        <div className='container-right'>
            <div className='content'>
                <Button loading={waiting_for_tx} onClick={handleCreateListing} intent='success' icon='tag' >Create Listing</Button>
                <Button loading={waiting_for_tx} onClick={deleteToken} intent='danger' icon='cross' >Delete token</Button>
            </div>
        </div>
        )
    }

    return (
        <div className='container' >
            <Card elevation={Elevation.THREE} >
                <div className='content-viewer' >
                    <img className='content-img' src={nft.imgSrc()} />
                </div>

                <div className='container' >
                    <div className='content'>
                        <p><b>{nft.metadata.title}</b> - <i>{nft.metadata.artist}</i></p>
                    </div>
                </div>
                {
                    editButtons
                }
            </Card>


            <MultistepDialog isOpen={listingVisible} onClose={handleCancelListing} finalButtonProps={{onClick:handleSubmitListing}} >
                <DialogStep 
                    id="price" 
                    title="price" 
                    panel={<ListingDetails tokenId={nft.asset_id} price={price} onPriceChange={handlePriceChange} ></ListingDetails>}>
                </DialogStep>
                <DialogStep 
                    id="confirm" 
                    title="confirm" 
                    panel={<ConfirmListingDetails tokenId={nft.asset_id} price={price} ></ConfirmListingDetails>} 
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

module.exports = NFTViewer 