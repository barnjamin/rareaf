/* eslint-disable no-console */
'use strict'

const React = require('react')
import { uploadContent } from './ipfs'
import { FileInput } from "@blueprintjs/core"

class Uploader extends React.Component {
  constructor(props) {
    super(props)
    this.captureFile = this.captureFile.bind(this)
  }

  async captureFile(event) {
    event.stopPropagation()
    event.preventDefault()
    let cid = await uploadContent(event.target.files)
    this.props.onUploaded(cid)
  }

  render() {
    if (this.props.cid === undefined) {
      return (
          <div className='container'>
            <div className='content content-piece'>
                <FileInput large={true} disabled={false} text="Choose file..." onInputChange={this.captureFile} /> 
            </div>
          </div>
          )
    }

    return (
    <div className='container' >
      <div className='content content-piece'>
        <img  id="gateway-link" target='_blank' src={'https://ipfs.io/ipfs/' + this.props.cid.path} />
      </div>
    </div>
    )

  }
}

module.exports = Uploader