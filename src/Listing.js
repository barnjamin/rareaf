/* eslint-disable no-console */
'use strict'

import React, {useState, useEffect} from 'react'
import {useParams, useHistory} from 'react-router-dom'
import {getTokensFromListingAddress} from './lib/algorand'
import {getCIDFromMetadataHash, getMetaFromIpfs} from './lib/ipfs'
import {FormGroup, Label, Button, MultistepDialog, DialogStep, Classes, NumericInput} from '@blueprintjs/core'
import { ButtonProps } from '@chakra-ui/react'
import { createListing } from './lib/listing'


function Listing() {
    const {addr} = useParams();
    const [balance, setBalance] = useState({tokenId: 0, metaHash:''});

    // Get the balance of the address
    // Fi

    useEffect(()=>{
        if(balance.tokenId ==0){
            getTokensFromListingAddress(addr).then((tokens)=>{
                console.log(tokens)
            })
        }

    })


    return (
        <div>{addr}</div>
    )

}

export default Listing;