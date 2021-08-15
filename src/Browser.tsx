/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useHistory, useParams, useLocation} from 'react-router-dom'

import { getListings } from './lib/algorand'
import {ListingCard} from './ListingCard'

import {Wallet} from 'algorand-session-wallet'
import { Button, Label, NumericInput } from '@blueprintjs/core'


type BrowserProps = {
    history: any
    wallet: Wallet 
    acct: string
};

export default function Browser(props: BrowserProps) {
    const {tag} = useParams()
    const filters = new URLSearchParams(useLocation().search)
    const history = useHistory()

    const [listings, setListings] = React.useState([]);
    const [loaded, setLoaded] = React.useState(false)

    let max=0
    if(filters.has('max-price')){ max = parseInt(filters.get("max-price")) }
    let min=0
    if(filters.has('min-price')){ min = parseInt(filters.get("min-price")) }

    const [maxPrice, setMaxPrice] = React.useState(max)
    const [minPrice, setMinPrice] = React.useState(min)
    const [filtersChanged, setFiltersChanged] = React.useState(true)


    React.useEffect(()=>{
        let subscribed = true
        if(!loaded && filtersChanged)
            getListings(tag, minPrice, maxPrice).then((l)=>{ 
                if(!subscribed) return

                setLoaded(true)
                setListings(l) 
                setFiltersChanged(false)
            })

        return ()=>{subscribed = false}
    }, [filtersChanged])

    function updateMaxPrice(val: number){ setMaxPrice(val) }
    function updateMinPrice(val: number){ setMinPrice(val) }

    function filterListings() { 
        const tagPath = tag?"tag/"+tag:""

        history.push("/"+tagPath+"?min-price="+minPrice+"&max-price="+maxPrice) 
        setLoaded(false)
        setFiltersChanged(true)
    }

    let l = listings.map((l) => { return (<ListingCard key={l.contract_addr} listing={l} />) }) 

    if(!loaded){
        l = [<h3 key='none' >Searching for listings...</h3>]
    }

    if(loaded && listings.length == 0){
        l = [<h3 key='none' >No Listings... <a href='/mint'>mint</a> one?</h3>]
    }

    // Only allow filtering by price if no tag is chosen
    const priceFilter = tag===undefined?(
        <div className='container price-filter'>
            <Label className='bp3-inline'>
                Minimum Price
                <NumericInput placeholder={"Minimum Price"} large={true} onValueChange={updateMinPrice} value={minPrice} buttonPosition='none'/>
            </Label>
            <Label className='bp3-inline'>
                Maximum Price
                <NumericInput placeholder={"Maximum Price"} large={true} onValueChange={updateMaxPrice} value={maxPrice} buttonPosition='none' />
            </Label>
            <Button outlined={true} large={true} minimal={true} text='Filter' onClick={filterListings} />
        </div>
    ):<div></div>

    return (
        <div className='vertical-container' >
            {priceFilter}
            <div className='container filtered-listings' >
                { l }
            </div>
        </div>
    )
}