/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'

import { getListings } from './lib/algorand'
import {ListingCard} from './ListingCard'

type BrowserState = {};

export function Browser() {
    const {tag} = useParams()
    const [listings, setListings] = React.useState([]);

    React.useEffect(()=>{
        getListings(tag).then((l)=>{ setListings(l) })
    }, [])

    return (
        <div className='container' >
            { 
                listings.map((l) => {     
                    return (<ListingCard key={l.contract_addr} listing={l} />)
                }) 
            }
        </div>
    )
}

module.exports = Browser