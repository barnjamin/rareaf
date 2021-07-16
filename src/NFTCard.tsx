
/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'
import {Card} from '@blueprintjs/core'
import {NFT} from './lib/nft'

type NFTCardState = {};
type NFTCardProps = {
    nft: NFT;
};

export function NFTCard(props: NFTCardProps) {
    return (
        <Card className='nft-card'  >
            <div className='container'>
                <a href={'/nft/'+props.nft.asset_id}>
                    <img src={props.nft.imgSrc()}></img>
                </a>
            </div>
            <div className='container'>
                <p>
                    <a href={'/nft/'+props.nft.asset_id}>
                        <b>{props.nft.metadata.name}</b> - <i>{props.nft.metadata.properties.artist}</i>
                    </a>
                </p>
            </div>
            <div className='container'>
                <p>{props.nft.metadata.description}</p>
            </div>
        </Card> 
    )

}