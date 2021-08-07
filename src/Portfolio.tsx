/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'

import { NFTCard } from './NFTCard'
import { ListingCard } from './ListingCard'
import {Card, Elevation, Tab, Tabs} from "@blueprintjs/core"


import { Wallet } from 'algorand-session-wallet'
import { Listing } from './lib/listing'
import { NFT } from './lib/nft'
import { getPortfolio } from './lib/algorand'


type PortfolioProps = { 
    history: any
    wallet: Wallet
    acct: string
};

export default function Portfolio(props: PortfolioProps) {

    const {addr} = useParams()

    const port_acct = (addr !== undefined) ? addr : props.acct

    const [listings, setListings] = React.useState([])
    const [nfts, setNFTs] = React.useState([])


    React.useEffect(()=>{
        if(port_acct === undefined) return

        let isSubscribed = true

        getPortfolio(port_acct).then(p=>{
          if (isSubscribed) {
            setListings(p['listings'])
            setNFTs(p['nfts'])
          }
        })

        return () => {isSubscribed = false}
    }, [port_acct])


    return (
        <div className='container'>
            <Card elevation={Elevation.THREE}>
                <div className='container portfolio-name'>
                    <h3>{port_acct}</h3>
                </div>
                <div className='container portfolio-content' >
                    <Tabs id='portfolio' large={true} >
                        <Tab id='nfts' title='Collection' panel={<NFTPanel nfts={nfts} /> } />
                        <Tab id='listings' title='Listings' panel={<ListingPanel listings={listings} />} />
                    </Tabs>
                </div>
            </Card>
        </div>
    )
}

type NFTPanelProps = {
    nfts: NFT[]
};
function NFTPanel(props: NFTPanelProps) {
    let n = props.nfts.map((n)=>{ return(<NFTCard key={n.asset_id} nft={n} />) }) 
    if (props.nfts.length==0)
        n = [<h3 key='none'>No NTFs yet, <a href='/mint'>Mint</a> one?</h3>]
    return (
        <div className='container nft-panel'>
            {n}
        </div>
    )
}

type ListingPanelProps = { 
    listings: Listing[]
};

function ListingPanel(props: ListingPanelProps) {
    let l = props.listings.map((l)=>{ 
        return ( <ListingCard key={l.asset_id.toString()} listing={l} /> ) 
    })

    if(props.listings.length == 0)
        l = [<h3 key='none'>No listings</h3>]
    
    return (
        <div className='container listing-panel' >
            { l }
        </div>
    )
}