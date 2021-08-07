/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'

import { getListings } from './lib/algorand'
import {ListingCard} from './ListingCard'

import {Wallet} from 'algorand-session-wallet'


type BrowserProps = {
    history: any
    wallet: Wallet 
    acct: string
};

export default function Browser(props: BrowserProps) {
    const {tag} = useParams()
    const [listings, setListings] = React.useState([]);
    const [loaded, setLoaded] = React.useState(false)

    React.useEffect(()=>{
        getListings(tag).then((l)=>{ 
            setLoaded(true)
            setListings(l) 
        })
    }, [])

    let l = listings.map((l) => {     return (<ListingCard key={l.contract_addr} listing={l} />) }) 
    if(listings.length==0){
        if(loaded){
            l = [<h3 key='none' >No Listings... <a href='/mint'>mint</a> one?</h3>]
        }
        l = [<h3 key='none' >Searching for listings...</h3>]
    }
    return (
        <div className='container' >
            { l }
        </div>
    )
}