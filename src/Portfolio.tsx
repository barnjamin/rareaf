/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'

import { NFTCard } from './NFTCard'
import { ListingCard } from './ListingCard'
import {Tab, Tabs} from "@blueprintjs/core"


import { Wallet } from './wallets/wallet'
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

        getPortfolio(port_acct).then(p=>{
            setListings(p['listings'])
            setNFTs(p['nfts'])
        })
    }, [])


    return (
        <div className='container'>
            <div className='container portfolio-name'>
                <h3>{port_acct}</h3>
            </div>
            <div className='container portfolio-content'>
                <Tabs id='portfolio' vertical={true} large={true}>
                    <Tab id='nfts' title='Collection' panel={<NFTPanel nfts={nfts} /> } />
                    <Tab id='listings' title='Listings' panel={<ListingPanel listings={listings} />} />
                </Tabs>
            </div>
        </div>
    )
}

type NFTPanelProps = {
    nfts: NFT[]
};
function NFTPanel(props: NFTPanelProps) {
    return (
        <div className='container nft-panel'>
            {
                 props.nfts.map((n)=>{ 
                    return(<NFTCard key={n.asset_id} nft={n} />) 
                })
            }
        </div>
    )
}

type ListingPanelProps = { 
    listings: Listing[]
};
function ListingPanel(props: ListingPanelProps) {
    console.log(props)
    return (
        <div className='container listing-panel' >
            { 
                props.listings.map((l)=>{ 
                    return (
                        <ListingCard key={l.asset_id} listing={l} />
                    ) 
                })
            }
        </div>
    )
}