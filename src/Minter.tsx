/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import { uploadContent, uploadMetadata } from './lib/ipfs'
import IPFS from 'ipfs-core'
import { Button, Elevation, FileInput, Card } from "@blueprintjs/core"
import { NFT, NFTMetadata, emptyMetadata } from './lib/nft'
import { platform_settings as ps } from './lib/platform-conf'
import {Wallet} from './wallets/wallet'

type MinterProps = {
    history: any 
    wallet: Wallet
    acct: string
};

export default function Minter(props: MinterProps){
    const [meta, setMeta] = React.useState(emptyMetadata())
    const [loading, setLoading] = React.useState(false)

    function setFileHash(cid) {
        setMeta(meta=>({
            ...meta, 
            "file_cid":  cid, 
            "file_hash": cid.string
        }))
    }

    function setFileDetails(file) {
        setMeta(meta=>({
            ...meta,
            "file_name": file.name,
            "file_size": file.size, 
            "file_type": file.type 
        }))
    }

    function createMetaAndToken(event) {
        event.stopPropagation()
        event.preventDefault()

        setLoading(true) 

        const metadata = captureMetadata()

        uploadMetadata(metadata).then((meta_details) => {
            const nft = new NFT(metadata);
            nft.meta_cid = meta_details.cid

            nft.createToken(props.wallet).then((res) => {
                if ('asset-index' in res) 
                    props.history.push("/nft/" + res['asset-index'])
            }).catch((err)=>{ 
                alert("Failed to create token")
                console.error("Failed to create token: ", err)
            })

        }).catch((err) => { 
            console.error("Failed to upload metadata", err) 
            alert("Failed to upload metadata")
            setLoading(false)
        })
    }

    function handleChangeMeta(event) {
        const target = event.target
        const value = target.type == 'checkbox' ? target.checked : target.value
        const name = target.name
        setMeta(meta=>({
            ...meta,
            [name]: value 
        }))
    }

    function captureMetadata() {
        return {
            file_name: meta.file_name,
            file_size: meta.file_size,
            file_type: meta.file_type,
            file_hash: meta.file_hash,

            title:       meta.title,
            artist:      meta.artist,
            description: meta.description,
        }
    }

    return (
        <div className='container'>
            <Card elevation={Elevation.TWO} >
                <Uploader
                    onUploaded={setFileHash}
                    setFileDetails={setFileDetails}
                    {...meta} />

                <div className='container' >
                    <input
                        name='title'
                        placeholder='Title...'
                        className='details-basic details-title bp3-input bp3-large'
                        onChange={handleChangeMeta}
                        type='text'
                        id='title'
                        value={meta.title} />
                    <input
                        name='artist'
                        placeholder='Artist...'
                        className='details-basic details-artist bp3-input bp3-large'
                        onChange={handleChangeMeta}
                        type='text'
                        id='artist'
                        value={meta.artist} />
                </div>

                <div className='container'>
                    <textarea
                        placeholder='Description...'
                        className='details-description bp3-input bp3-large'
                        onChange={handleChangeMeta}
                        name='description'
                        id='description'
                        value={meta.description} />
                </div>

                <div className='container-mint'>
                    <Button
                        loading={loading}
                        onClick={createMetaAndToken}
                        rightIcon='clean'
                        large={true}
                        intent='success'
                        text='Mint' />
                </div>
            </Card>
        </div>
    )

}

type UploaderProps = {
    file_hash: string
    setFileDetails(e: any)
    onUploaded(cid: IPFS.CID)
};

function Uploader(props: UploaderProps) {
    const [cid, setCID] = React.useState(undefined)

    function captureFile(event) {
        event.stopPropagation()
        event.preventDefault()

        props.setFileDetails(event.target.files.item(0))

        uploadContent(event.target.files).then((cid) => {
            setCID(cid.cid)
            props.onUploaded(cid.cid)
        })
    }

    if (props.file_hash === undefined || props.file_hash == "" ) return (
        <div className='container'>
            <div className='content content-piece'>
                <FileInput large={true} disabled={false} text="Choose file..." onInputChange={captureFile} />
            </div>
        </div>
    )


    return (
        <div className='container' >
            <div className='content content-piece'>
                <img id="gateway-link" src={ps.ipfs.display + props.file_hash} />
            </div>
        </div>
    )

}