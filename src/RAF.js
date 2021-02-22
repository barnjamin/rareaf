/* eslint-disable no-console */
'use strict'

const React = require('react')
import {Card} from '@blueprintjs/core'
import {useParams} from 'react-router-dom'

function RAF() {
    let {id} = useParams();

    // get the get the metadata from this thing

    return (
        <div className='container'>
            <p>{id}</p>
        </div>
    )
}

export default RAF