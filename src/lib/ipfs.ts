/* eslint-disable no-console */

import IPFS from 'ipfs-core'
import ipfsClient from 'ipfs-http-client'
import { emptyMetadata, NFTMetadata } from './nft'
import {platform_settings as ps} from './platform-conf'

import { NFTStorage } from 'nft.storage'
const client = new NFTStorage({ token: ps.ipfs.token })

let iclient: any;
export async function getClient() {
    if(iclient === undefined){
        iclient = await ipfsClient({url: ps.ipfs.host})
    }
    return iclient
}

export async function uploadContent(file: File[]): Promise<any> {
    try { 
        return client.storeBlob(file[0])
    } catch (err) { console.error(err) }
    return null
}

export async function uploadMetadata(md: NFTMetadata): Promise<any> {
    try { 
        const client = await getClient()
        return client.add(JSON.stringify(md)) 
    } catch (err) { console.error(err) }
    return null 
}

export async function resolveMetadataFromMetaHash(meta_hash) {
    const cid = getCIDFromTruncatedMetadataHash(meta_hash)
    return [cid, await getMetaFromIpfs(cid.toString())]
}
export function getCID(mh: string): IPFS.CID {
    return new IPFS.CID(mh)
}

export async function getMetaFromIpfs(cid): Promise<NFTMetadata>{
    try {
        const iclient = await getClient()

        const decoder = new TextDecoder();
        let data = "";
        for await (const chunk of iclient.cat(cid)) {
            data += decoder.decode(chunk);
        }

        return JSON.parse(data) as NFTMetadata
    } catch (err) { console.error("Failed to get Metadata from IPFS:", err) }

    return emptyMetadata()
}

export function getCIDFromTruncatedMetadataHash(b64_string) {
    const u8a = new Uint8Array(Buffer.from(b64_string, 'base64'))
    let cid_hash = new Uint8Array(34)
    //Magic numbers to set CIDv0
    cid_hash.set([18,32], 0)
    cid_hash.set(u8a, 2)
    return new IPFS.CID(cid_hash)
}