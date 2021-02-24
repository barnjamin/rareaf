/* eslint-disable no-console */
'use strict'

const React = require('react')
import { uploadContent } from './ipfs'
import { FileInput } from "@blueprintjs/core"

class Uploader extends React.Component {
  constructor(props) {
    super(props)


    // bind methods
    this.captureFile = this.captureFile.bind(this)
  }

  async captureFile(event) {
    event.stopPropagation()
    event.preventDefault()
    let file_hash = await uploadContent(event.target.files)
    this.props.onUploaded(file_hash)
  }

  render() {
    if (this.props.file_hash === undefined) {
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
        <img  id="gateway-link" target='_blank' src={'https://ipfs.io/ipfs/' + this.props.file_hash} alt={this.props.file_hash} />
      </div>
    </div>
    )

  }
}

module.exports = Uploader