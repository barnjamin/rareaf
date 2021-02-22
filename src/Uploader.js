/* eslint-disable no-console */
'use strict'

const React = require('react')
const ipfsClient = require('ipfs-http-client')
import { FileInput } from "@blueprintjs/core"

class Uploader extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      ipfs: ipfsClient("/ip4/127.0.0.1/tcp/5001"),
      file_hash: null,
    }

    // bind methods
    this.handleSubmit = this.handleSubmit.bind(this)
    this.captureFile = this.captureFile.bind(this)
    this.saveFileToIpfs = this.saveFileToIpfs.bind(this)
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
        file, { progress: (prog) => console.log(`received: ${prog}`) }
      )
      this.setState({ file_hash: added.cid.toString() })
      this.props.onUploaded(this.state.file_hash)
    } catch (err) {
      console.error(err)
    }
  }

  render() {

    if (!this.state.file_hash) {
      return (
          <div className='content'>
            <div className='container content-piece'>
                <FileInput large={true} disabled={false} text="Choose file..." onInputChange={this.captureFile} /> 
            </div>
          </div>
          )
    }
    return (
    <div className='content'>
      <div className='container content-piece'>
        <img  id="gateway-link" target='_blank' src={'https://ipfs.io/ipfs/' + this.state.file_hash} alt={this.state.file_hash} />
      </div>
    </div>
    )

  }
}

module.exports = Uploader