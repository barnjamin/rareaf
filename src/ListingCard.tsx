'use strict'

import * as React from 'react'
import { AnchorButton, Card } from '@blueprintjs/core'
import { Listing} from './lib/listing'


type ListingCardProps = { key: string, listing: Listing; };
type ListingCardState = { };

export function ListingCard(props) {

    const l  = props.listing
    const md = l.nft.metadata

    return (
        <Card className='content-card'  >
            <div className='container'>
                <a href={'/listing/'+l.contract_addr}>
                    <img src={l.nft.imgSrc()}></img>
                </a>
            </div>
            <div className='container'>
                <p>
                    <a href={'/listing/'+l.contract_addr}> 
                        <b>{md.title}</b> - <i>{md.artist}</i> (${l.price})
                    </a>

                </p>
            </div>
            <div className='container'>
                <p>{md.description}</p>
            </div>
            <div className='container'>
                {
                    l.tags.map((t)=>{
                        return ( <AnchorButton key={t.id} small={true} minimal={true} href={'/tag/'+ t.name} text={t.name} />)
                    })
                } 
            </div>
        </Card> 
    )
}