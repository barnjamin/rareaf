/* eslint-disable no-console */
'use strict'

const React = require('react')
import {Card} from '@blueprintjs/core'
import {useParams} from 'react-router-dom'

function RAF() {
    let {id} = useParams();
    return (
        <p>{id}</p>
    )
}

export default RAF