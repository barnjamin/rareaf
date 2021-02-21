/* eslint-disable no-console */
'use strict'

const React = require('react')
const ipfsClient = require('ipfs-http-client')
import { Divider,Card,Button,FileInput, FormGroup, InputGroup, TextArea } from "@blueprintjs/core"

class Uploader extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      ipfs: ipfsClient("/ip4/127.0.0.1/tcp/5001"),
      file_hash: null,
      meta_hash: null,
      title: "unnamed",
      artist: "anon",
      description: "speaks for itself",
      tags: ["art", "is", "in", "your", "mind"],
    }

    // bind methods
    this.handleSubmit = this.handleSubmit.bind(this)
    this.captureFile = this.captureFile.bind(this)
    this.saveFileToIpfs = this.saveFileToIpfs.bind(this)

    this.handleInputChange = this.handleInputChange.bind(this)
    this.captureMetadata = this.captureMetadata.bind(this)
    this.saveMetadataToIpfs = this.saveMetadataToIpfs.bind(this)
  }

  handleSubmit(event) { event.preventDefault() }

  captureFile(event) {
    event.stopPropagation()
    event.preventDefault()
    this.saveFileToIpfs(event.target.files)
  }

  async saveFileToIpfs([file]) {
    try {
      const added = await this.state.ipfs.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      console.log(added)
      this.setState({ file_hash: added.cid.toString() })
    } catch (err) {
      console.error(err)
    }
  }


  handleInputChange(event) {
    const target = event.target
    const value = target.type == 'checkbox' ? target.checked : target.value
    const name = target.name
    this.setState({ [name]: value })
  }

  captureMetadata(event) {
    event.stopPropagation()
    event.preventDefault()
    console.log(this.state)
    const meta = {
      title: this.state.title,
      artist: this.state.artist,
      file_hash: this.state.file_hash,
      description: this.state.description,
      tags: this.state.tags,
    }

    this.saveMetadataToIpfs(meta)
  }

  async saveMetadataToIpfs(meta) {
    try {
      const added = await this.state.ipfs.add(
        JSON.stringify(meta),
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      console.log(added)
      this.setState({ meta_hash: added.cid.toString() })
    } catch (err) {
      console.error(err)
    }
  }

  render() {

    let imgtag=undefined;
    let disabled= this.state.file_hash === null
    if (!this.state.file_hash) {
      imgtag =  
          <div className='container content-piece'>
              <FileInput large={true} disabled={false} text="Choose file..." onInputChange={this.captureFile} /> 
          </div>
    }else{
      imgtag =  
          <div className='container content-piece'>
            <img  id="gateway-link" target='_blank' src={'https://ipfs.io/ipfs/' + this.state.file_hash} alt={this.state.file_hash} />
          </div>
    }

    return (
      <div className='content'>
        {imgtag}
        <div className='container' >
          <input className='details-basic details-title bp3-input bp3-large' onChange={this.handleInputChange} type='text' name='title' id='title' value={this.state.title}></input>
          <input className='details-basic details-artist bp3-input bp3-large' onChange={this.handleInputChange} type='text' name='artist' id='artist' value={this.state.artist}></input>
        </div>
        <div className='container'> 
              <textarea className='details-description bp3-input bp3-large' onChange={this.handleInputChange} type='text' name='description' id='description' value={this.state.description}></textarea>
        </div>
      </div>
    )
  }
}

module.exports = Uploader