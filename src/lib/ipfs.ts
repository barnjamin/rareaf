/* eslint-disable no-console */

import { NFTStorage   } from 'nft.storage'
import { Token, TokenInput } from 'nft.storage/dist/src/lib/interface'
import { get_file } from './contracts'

import { NFT, NFTMetadata } from './nft'
import {platform_settings as ps} from './platform-conf'

//TODO: pin it?

export async function storeNFT(file: File, md: NFTMetadata): Promise<any> {
    const client = new NFTStorage({ token: ps.ipfs.token })
    const toStore ={...md, image:file} 
    console.log(toStore)
    return await client.store(toStore) 
}

export async function getNFTFromMetadata(url: string): Promise<NFT> {
    const data =  await get_file(NFT.resolveUrl(url))

    if(data.toString() == 'null' || data == undefined) return undefined;

    const md = JSON.parse(data) as NFTMetadata
    return new NFT(md)
}