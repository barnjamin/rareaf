/* eslint-disable no-console */
'use strict'

const React = require('react')
import { uploadContent } from './ipfs'
import { FileInput } from "@blueprintjs/core"

class Uploader extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      file_hash: null,
    }

    // bind methods
    this.handleSubmit = this.handleSubmit.bind(this)
    this.captureFile = this.captureFile.bind(this)
  }

  handleSubmit(event) { event.preventDefault() }

  captureFile(event) {
    event.stopPropagation()
    event.preventDefault()
    let file_hash = uploadContent(event.target.files)
    this.setState({file_hash:file_hash})
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