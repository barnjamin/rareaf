/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'

import { getPortfolio } from './lib/algorand'
import { NFTCard } from './NFTCard'
import { ListingCard } from './ListingCard'
import { Wallet } from './wallets/wallet'

type PortfolioProps = { 
    history: any
    wallet: Wallet
    acct: string
};
type PortfolioState = {};

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
    }, [port_acct])

    return (
        <div className='container'>
            <div className='container portfolio-listings'>
                <h3>Listings</h3>
                { 
                    listings.map((l)=>{ 
                        return (
                            <ListingCard key={l.asset_id} listing={l} />
                        ) 
                    })
                }
            </div>
            <hr/>
            <div className='container portfolio-nfts'>
                <h3>NFTs</h3>
                {
                    nfts.map((n)=>{ return(<NFTCard key={n.asset_id} nft={n} />) })
                }
            </div>

        </div>
    )

}