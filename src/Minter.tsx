/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import { uploadContent, uploadMetadata } from './lib/ipfs'
import { Button, Elevation, FileInput, Card } from "@blueprintjs/core"
import { NFT, NFTMetadata, emptyMetadata } from './lib/nft'
import { platform_settings as ps } from './lib/platform-conf'
import {Wallet} from './wallets/wallet'
import { isMetaProperty } from 'typescript'

type MinterProps = {
    history: any 
    wallet: Wallet
    acct: string
};

type MinterState = {
    meta: NFTMetadata 
    loading: boolean
};

export default class Minter extends React.Component<MinterProps, MinterState> {

    props: MinterProps;
    state: MinterState = {
        meta: emptyMetadata(),
        loading: false
    };

    constructor(props) {
        super(props)
        this.handleChangeMeta   = this.handleChangeMeta.bind(this)
        this.createMetaAndToken = this.createMetaAndToken.bind(this)
        this.setFileHash        = this.setFileHash.bind(this)
        this.setFileDetails     = this.setFileDetails.bind(this)
    }

    setFileHash(cid) {
        this.setState((state)=>{
            const m = state.meta
            return {meta: { ...m, file_cid: cid, file_hash: cid.path } }
        })
    }

    setFileDetails(file) {
        this.setState((state)=>{
            const m = state.meta
            return {meta: { ...m, file_name: file.name, file_size: file.size, file_type: file.type } }
        })
    }

    createMetaAndToken(event) {
        event.stopPropagation()
        event.preventDefault()

        this.setState({ loading: true })

        const metadata = this.captureMetadata()

        uploadMetadata(metadata).then((meta_cid) => {
            const nft = new NFT(metadata);
            nft.meta_cid = meta_cid

            nft.createToken(this.props.wallet).then((res) => {
                if ('asset-index' in res) this.props.history.push("/nft/" + res['asset-index'])
            }).catch((err)=>{ 
                alert("Failed to create token")
                console.error("Failed to create token: ", err)
                this.setState({ loading: false })
            })

        }).catch((err) => { 
            console.error("Failed to upload metadata", err) 
            alert("Failed to upload metadata")
            this.setState({ loading: false })
        })

    }

    handleChangeMeta(event) {
        const target = event.target
        const value = target.type == 'checkbox' ? target.checked : target.value
        const name = target.name
        this.setState((state)=>{
            const m = state.meta
            return { meta: { ...m,  [name]: value } }
        })
    }

    captureMetadata() {
        const m = this.state.meta
        return {
            file_name: m.file_name,
            file_size: m.file_size,
            file_type: m.file_type,
            file_hash: m.file_hash,

            title: m.title,
            artist: m.artist,
            description: m.description,
            tags: m.tags,
        }
    }

    render() {
        return (
            <div className='container'>
                <Card elevation={Elevation.TWO} >
                    <Uploader
                        onUploaded={this.setFileHash}
                        setFileDetails={this.setFileDetails}
                        cid={this.state.meta.file_hash}
                        wallet={this.props.wallet} />

                    <div className='container' >
                        <input
                            name='title'
                            placeholder='Title...'
                            className='details-basic details-title bp3-input bp3-large'
                            onChange={this.handleChangeMeta}
                            type='text'
                            id='title'
                            value={this.state.meta.title} />
                        <input
                            name='artist'
                            placeholder='Artist...'
                            className='details-basic details-artist bp3-input bp3-large'
                            onChange={this.handleChangeMeta}
                            type='text'
                            id='artist'
                            value={this.state.meta.artist} />
                    </div>

                    <div className='container'>
                        <textarea
                            placeholder='Description...'
                            className='details-description bp3-input bp3-large'
                            onChange={this.handleChangeMeta}
                            name='description'
                            id='description'
                            value={this.state.meta.description} />
                    </div>

                    <div className='container-mint'>
                        <Button
                            loading={this.state.loading}
                            onClick={this.createMetaAndToken}
                            rightIcon='clean'
                            large={true}
                            intent='success'
                            text='Mint' />
                    </div>
                </Card>
            </div>
        )
    }

}

function Uploader(props) {
    const [cid, setCID] = React.useState(undefined)

    function captureFile(event) {
        event.stopPropagation()
        event.preventDefault()

        props.setFileDetails(event.target.files.item(0))

        uploadContent(event.target.files).then((cid) => {
            setCID(cid)
            props.onUploaded(cid)
        })
    }

    if (props.file_hash === undefined) return (
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