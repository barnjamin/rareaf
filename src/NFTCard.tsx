
/* eslint-disable no-console */
'use strict'

import * as React from 'react'
import {useParams} from 'react-router-dom'
import {Card} from '@blueprintjs/core'
import NFT from './lib/nft'

type NFTCardState = {};
type NFTCardProps = {
    nft: NFT;
};

export function NFTCard(props: NFTCardProps) {
    return (
        <Card className='content-card'  >
            <div className='container'>
                <a href={'/RAF/'+props.nft.asset_id}>
                    <img src={props.nft.imgSrc()}></img>
                </a>
            </div>
            <div className='container'>
                <p>
                    <a href={'/RAF/'+props.nft.asset_id}>
                        <b>{props.nft.metadata.title}</b> - <i>{props.nft.metadata.artist}</i>
                    </a>
                </p>
            </div>
            <div className='container'>
                <p>{props.nft.metadata.description}</p>
            </div>
        </Card> 
    )

}