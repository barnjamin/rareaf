/* eslint-disable no-console */

import ipfsClient from 'ipfs-http-client'
import { NFTStorage } from 'nft.storage'

import { NFT, NFTMetadata } from './nft'
import {platform_settings as ps} from './platform-conf'


let iclient: any;
export async function getClient() {
    if(iclient === undefined){
        iclient = await ipfsClient({url: ps.ipfs.host})
    }
    return iclient
}

export async function storeNFT(file: File, md: NFTMetadata): Promise<any> {
    const client = new NFTStorage({ token: ps.ipfs.token })
    return await client.store({...md, image:file}) 
}

export async function getNFT(url: string): Promise<NFT> {
    const client = await getClient() 

    //TODO: store just the hash?
    const u = url.slice(27)

    const decoder = new TextDecoder();
    let data = "";
    for await (const chunk of client.cat(u)) {
        data += decoder.decode(chunk);
    }

    const md = JSON.parse(data) as NFTMetadata
    console.log(md)

    return new NFT(md)
}