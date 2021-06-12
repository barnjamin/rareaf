/* eslint-disable no-console */

import  ipfsClient, { CID } from 'ipfs-http-client'
import { NFTMetadata } from './nft'
import {platform_settings as ps} from './platform-conf'

const iclient = ipfsClient(ps.ipfs)

export async function uploadContent([file]): Promise<CID> {
    try { return await iclient.add(file) } 
    catch (err) { console.error(err) }
    return null
}

export async function uploadMetadata(md: NFTMetadata): Promise<CID> {
    try { return await iclient.add(JSON.stringify(md)) } 
    catch (err) { console.error(err) }
    return null 
}

export async function resolveMetadataFromMetaHash(meta_hash) {
    const cid = getCIDFromMetadataHash(meta_hash)
    return [cid, await getMetaFromIpfs(cid.toString())]
}

export async function getMetaFromIpfs(meta_hash) {
    try {
        let data = "" 
        for await (const chunk of iclient.cat(meta_hash)) {
            data += new TextDecoder("utf-8").decode(chunk);
        }
        let parsed =  JSON.parse(data) 
        return parsed
    } catch (err) { console.error("Failed to get Metadata from IPFS:", err) }

    return {}
}

export function getCIDFromMetadataHash(b64_string) {
    const u8a = new Uint8Array(Buffer.from(b64_string, 'base64'))
    let cid_hash = new Uint8Array(34)
    //Magic numbers to set CIDv0
    cid_hash.set([18,32], 0)
    cid_hash.set(u8a, 2)
    return new CID(cid_hash)
}