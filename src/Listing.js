/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import {getTokensFromListingAddress} from './lib/algorand'
import {getCIDFromMetadataHash} from './lib/ipfs'

function Listing() {
    const {addr} = useParams();
    const [listing, setListingData] = useState({tokenId: 0, metaHash:'', price:0});

    useEffect(()=>{
        if(balance.tokenId==0){
            getTokensFromListingAddress(addr).then((tokens)=>{
                if(tokens.length > 0) {
                    let token = tokens[0]
                    setListingData({
                        tokenId:token.index, 
                        metaHash:getCIDFromMetadataHash(token.params['metadata-hash']).toString()
                    })
                }
            })
        }
    })


    return (
        <div>
            <p>{addr}</p>
            <p>{balance.tokenId}</p>
            <p>{balance.metaHash}</p>
        </div>
    )

}

export default Listing;