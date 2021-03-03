/* eslint-disable no-console */
'use strict'

import React from 'react'
import {uploadMetadata} from './ipfs'
import {createToken} from './algorand'
import { Button } from "@blueprintjs/core"

class AlgorandTokenizer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            meta_cid: {},
            file_hash: undefined,
            title: "unnamed",
            artist: "anon",
            description: "speaks for itself",
            tags: ["art", "is", "in", "your", "mind"],
            props:props,
            waiting_for_tx:false
        }
        this.handleChange = this.handleChange.bind(this)
        this.createMetaAndToken = this.createMetaAndToken.bind(this)
    }

    static getDerivedStateFromProps(props, state) {
        if (props.cid !== undefined && props.cid.path !== state.file_hash){
            return { file_hash:props.cid.path }
        }
        return null
    }

    async createMetaAndToken(event) {
        event.stopPropagation()
        event.preventDefault()
        this.setState({waiting_for_tx:true})
        try{
            const meta_cid = await uploadMetadata(this.captureMetadata())
            this.setState({meta_cid:meta_cid})
            await createToken(meta_cid)
        }catch(err){
            console.error(err)
        }
        this.setState({waiting_for_tx:false})

    }

    handleChange(event) {
        const target = event.target
        const value = target.type == 'checkbox' ? target.checked : target.value
        const name = target.name
        this.setState({ [name]: value })
    }

    captureMetadata() {
        return {
            title: this.state.title,
            artist: this.state.artist,
            file_hash: this.state.file_hash,
            description: this.state.description,
            tags: this.state.tags,
            created: "Created at Rare.AF"
        }
    }

    render() {
        return (
            <div>
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
module.exports = AlgorandTokenizer