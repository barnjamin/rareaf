/* eslint-disable no-console */
'use strict'

const React = require('react')
import {Card} from '@blueprintjs/core'
import {useParams} from 'react-router-dom'
import {getTokenMetadata} from './algorand'

function RAF() {
    let {id} = useParams();

    const md =  getTokenMetadata(parseInt(id))
    // get the get the metadata from this thing

    return (
        <div className='container'>
            <div className='content content-viewer' >
                <img className='content-img' src={'http://ipfs.io/ipfs/'+md['file_hash']} />
            </div>
            <div className='container' >
                <div className='content'>
                    <h3><b>{md['title']}</b></h3>
                </div>
            </div>
        </div>
    )
}

export default RAF