/* eslint-disable no-console */
'use strict'

import React, {useState} from 'react'
import {uploadContent, uploadMetadata} from './lib/ipfs'
import { Button, FileInput } from "@blueprintjs/core"
import NFT from './lib/nft'

export default class Minter extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            meta_cid: {},
            file_cid: {},

            file_hash: undefined,
            file_name: "",
            file_size: 0,
            file_type: "",

            title: "unnamed",
            artist: "anon",
            description: "speaks for itself",
            tags: ["art", "is", "in", "your", "mind"],

            waiting_for_tx:false
        }

        this.handleChange       = this.handleChange.bind(this)
        this.createMetaAndToken = this.createMetaAndToken.bind(this)
        this.setFileHash        = this.setFileHash.bind(this)
        this.setFileDetails     = this.setFileDetails.bind(this)
    }
    setFileHash(cid) {
        this.setState({ file_cid: cid, file_hash: cid.path })
    }

    setFileDetails(file) {
        this.setState({
            file_name:file.name,
            file_size:file.size,
            file_type:file.type,
        })
    }

    async createMetaAndToken(event) {
        event.stopPropagation()
        event.preventDefault()

        this.setState({waiting_for_tx:true})

        try{

            const meta_cid = await uploadMetadata(this.captureMetadata())
            this.setState({meta_cid:meta_cid})

            const nft = await NFT.fromMetaHash(meta_cid.path);
            const res = await nft.createToken(this.props.wallet)
            console.log(res)
        }catch(err){
            console.log("Failed to upload metadata", err)
            return
        }



        this.setState({waiting_for_tx:false})

        // TODO:  redirect to /raf/:id
    }

    handleChange(event) {
        const target = event.target
        const value = target.type == 'checkbox' ? target.checked : target.value
        const name = target.name
        this.setState({ [name]: value })
    }

    captureMetadata() {
        return {
            file_name:  this.state.file_name,
            file_size:  this.state.file_size,
            file_type:  this.state.file_type,
            file_hash:  this.state.file_hash,

            title:       this.state.title,
            artist:      this.state.artist,
            description: this.state.description,
            tags:        this.state.tags,
        }
    }

    render() {
        return (
            <div>
                <Uploader onUploaded={this.setFileHash} setFileDetails={this.setFileDetails} cid={this.state.cid} wallet={this.props.wallet}>  </Uploader>

                <div className='container' >
                    <input name='title' className='details-basic details-title bp3-input bp3-large' onChange={this.handleChange} type='text' name='title' id='title' value={this.state.title}></input>
                    <input name='artist' className='details-basic details-artist bp3-input bp3-large' onChange={this.handleChange} type='text' name='artist' id='artist' value={this.state.artist}></input>
                </div>
                <div className='container'>
                    <textarea className='details-description bp3-input bp3-large' onChange={this.handleChange} type='text' name='description' id='description' value={this.state.description}></textarea>
                </div>
                <div className='container-mint'>
                    <Button loading={this.state.waiting_for_tx} onClick={this.createMetaAndToken} rightIcon='clean' large={true} intent='success'>Mint</Button>
                </div>
            </div>
        )
    }

}

function Uploader(props) {
    const [cid, setCID] = useState(undefined)

    function captureFile(event) {
        event.stopPropagation()
        event.preventDefault()

        props.setFileDetails(event.target.files.item(0))

        uploadContent(event.target.files).then((cid)=>{
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
            <img  id="gateway-link" target='_blank' src={'https://ipfs.io/ipfs/' + cid.path} />
        </div>
    </div>
    )

}