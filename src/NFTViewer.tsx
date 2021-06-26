/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams, useHistory} from 'react-router-dom'
import { getNFT, getTags } from './lib/algorand'
import {Card, FormGroup, Label, Button, MultistepDialog, DialogStep, Classes, NumericInput, Elevation} from '@blueprintjs/core'
import Listing, {TagToken} from './lib/listing'
import {Wallet} from './wallets/wallet'
import {NFT} from './lib/nft'
import Tagger from './Tagger'

type NFTViewerProps = {
    history: any
    wallet: Wallet
    acct: string
}

export default function NFTViewer(props: NFTViewerProps) {
    let {id} = useParams();
    let history = useHistory();

    const [nft, setNFT]                = React.useState(NFT.emptyNFT())

    const [waiting_for_tx, setWaiting]        = React.useState(false)
    const [price, setPrice]                   = React.useState(0)
    const [listingVisible, setListingVisible] = React.useState(false)
    const [tagOpts, setTagOpts]               = React.useState([])
    const [tags, setTags]                     = React.useState([])
    
    React.useEffect(()=>{
        getNFT(parseInt(id))
            .then((nft)=>{ setNFT(nft) })
            .catch((err)=>{ console.error("Error:", err) })

        getTags()
            .then((tagOpts)=>{ setTagOpts(tagOpts) })
            .catch((err)=>{ console.error("Error getting tags: ", err)})

    }, []);


    function handleCreateListing(){ setListingVisible(true) }
    function handleCancelListing(){ setListingVisible(false) }

    async function deleteToken(e){
        setWaiting(true)

        try {
            await nft.destroyToken(props.wallet)
            history.push("/")
        } catch (error) { console.error(error) }

        setWaiting(false)
    }

    async function handlePriceChange(price){ setPrice(price) }

    async function handleSubmitListing(){
        setWaiting(true); 

        try{
            const lst = new Listing(price, parseInt(id), props.wallet.getDefaultAccount())

            await lst.doCreate(props.wallet)

            await Promise.all(tags.map((tag)=>{ return lst.doTags(props.wallet, tag) }))

            history.push("/listing/"+lst.contract_addr)
        }catch(error){ console.log(error) }

        setWaiting(false);
    }

    let editButtons = <div />

    if(props.wallet !== undefined && nft.manager === props.wallet.getDefaultAccount()){
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
            <Card  elevation={Elevation.TWO} >
                <div className='content nft-viewer'>
                    <img src={nft.imgSrc()} />
                </div>

                <div className='container nft-details' >
                    <div className='nft-name'>
                        <p><b>{nft.metadata.title}</b> - <i>{nft.metadata.artist}</i></p>
                    </div>
                    <div className='nft-token-id' >
                        <p><a href={nft.explorerSrc()}><b>{nft.asset_id}</b></a></p>
                    </div>
                </div>

                <div className='container nft-description'>
                    <p> { nft.metadata.description }</p>
                </div>

                { editButtons }
            </Card>


            <MultistepDialog isOpen={listingVisible} onClose={handleCancelListing} finalButtonProps={{onClick:handleSubmitListing}} >
                <DialogStep 
                    id="price" 
                    title="price" 
                    panel={<ListingDetails tokenId={nft.asset_id} price={price} onPriceChange={handlePriceChange} />}>
                </DialogStep>
                <DialogStep 
                    id="tags" 
                    title="tags" 
                    panel={
                        <div className={Classes.DIALOG_BODY}>
                            <Tagger 
                                renderProps={{"fill":true}} 
                                tags={tags} 
                                tagOpts={tagOpts} 
                                setTags={setTags}/>
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


function ListingDetails(props){
    function handlePriceChange(vnum) {
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
            <h3>Listing:</h3>

            <p><b>Token:</b> {props.tokenId} </p>
            <p><b>Price:</b> {props.price} </p> 
            <p><b>Tags:</b> {props.tags.map(t=>{return t.name}).join(", ")}</p>
        </div>
    )
}
