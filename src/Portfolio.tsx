/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'

import { getPortfolio } from './lib/algorand'
import { NFTCard } from './NFTCard'
import { ListingCard } from './ListingCard'
import { Wallet } from './wallets/wallet'

type PortfolioProps = { wallet: Wallet; };
type PortfolioState = {};

export function Portfolio(props: PortfolioProps) {

    let {addr} = useParams()
    let [listings, setListings] = React.useState([])
    let [nfts, setNFTs] = React.useState([])

    if (addr === undefined && props.wallet !== undefined) {
        addr = props.wallet.getDefaultAccount()
    }

    React.useEffect(()=>{
        if(addr === undefined) return

        getPortfolio(addr).then(p=>{
            setListings(p['listings'])
            setNFTs(p['nfts'])
        })


    }, [addr])

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
module.exports = Portfolio