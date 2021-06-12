/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import { uploadContent, uploadMetadata } from './lib/ipfs'
import { Button, Elevation, FileInput, Card } from "@blueprintjs/core"
import {NFT, emptyMetadata} from './lib/nft'

export default class Minter extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            meta: emptyMetadata(),
            waiting_for_tx: false
        }

        this.handleChange       = this.handleChange.bind(this)
        this.createMetaAndToken = this.createMetaAndToken.bind(this)
        this.setFileHash        = this.setFileHash.bind(this)
        this.setFileDetails     = this.setFileDetails.bind(this)
    }

    setFileHash(cid) { this.setState({meta: { file_cid: cid, file_hash: cid.path } }) }

    setFileDetails(file) {
        this.setState({meta: { file_name: file.name, file_size: file.size, file_type: file.type }})
    }

    async createMetaAndToken(event) {
        event.stopPropagation()
        event.preventDefault()

        this.setState({ waiting_for_tx: true })

        try {

            const metadata = this.captureMetadata()
            const meta_cid = await uploadMetadata(metadata)

            const nft = new NFT(metadata);
            nft.meta_cid = meta_cid

            const res = await nft.createToken(this.props.wallet)

            if('asset-index' in res) { 
                this.props.history.push("/RAF/"+res['asset-index']) 
            }

        } catch (err) {
            console.log("Failed to upload metadata", err)
            return
        }

        this.setState({ waiting_for_tx: false })
    }

    handleChange(event) {
        const target = event.target
        const value = target.type == 'checkbox' ? target.checked : target.value
        const name = target.name
        this.setState({ [name]: value })
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
                        cid={this.state.meta.cid} 
                        wallet={this.props.wallet} /> 

                    <div className='container' >
                        <input 
                            name='title' 
                            className='details-basic details-title bp3-input bp3-large' 
                            onChange={this.handleChange} 
                            type='text' 
                            id='title' 
                            value={this.state.meta.title} />
                        <input 
                            name='artist' 
                            className='details-basic details-artist bp3-input bp3-large' 
                            onChange={this.handleChange} 
                            type='text' 
                            id='artist' 
                            value={this.state.meta.artist} />
                    </div>

                    <div className='container'>
                        <textarea 
                            className='details-description bp3-input bp3-large' 
                            onChange={this.handleChange} 
                            name='description' 
                            id='description' 
                            value={this.state.meta.description} />
                    </div>

                    <div className='container-mint'>
                        <Button 
                        loading={this.state.waiting_for_tx} 
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

    if (cid === undefined) {
        return (
            <div className='container'>
                <div className='content content-piece'>
                    <FileInput large={true} disabled={false} text="Choose file..." onInputChange={captureFile} />
                </div>
            </div>
        )
    }

    return (
        <div className='container' >
            <div className='content content-piece'>
                <img id="gateway-link" src={'https://ipfs.io/ipfs/' + cid.path} />
            </div>
        </div>
    )

}