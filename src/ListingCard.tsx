'use strict'

import * as React from 'react'
import { AnchorButton, Card, Elevation } from '@blueprintjs/core'
import { Listing} from './lib/listing'
import { PriceToken } from './lib/price';


type ListingCardProps = { key: string, listing: Listing; };

export function ListingCard(props: ListingCardProps) {

    const l  = props.listing
    const md = l.nft.metadata

    return (
        <Card className='listing-card' elevation={Elevation.TWO} >
            <div className='container'>
                <a href={'/listing/'+l.contract_addr}>
                    <img src={l.nft.imgSrc()}></img>
                </a>
            </div>
            <div className='container'>
                <p>
                    <a href={'/listing/'+l.contract_addr}> 
                        <b>{md.name}</b> - <i>{PriceToken.format(l.price_token, l.price)} {l.price_token.asa.unitName}</i>
                    </a>

                </p>
            </div>
            <div className='container listing-card-tags'>
                {
                    l.tags.map((t)=>{
                        return <AnchorButton 
                            key={t.id} 
                            large={true}
                            minimal={true}
                            outlined={true}
                            href={'/tag/'+ t.name} 
                            text={t.name} 
                        />
                    })
                } 
            </div>
        </Card> 
    )
}