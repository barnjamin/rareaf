/* eslint-disable no-console */

import CID from 'cids'
import ipfsClient from 'ipfs-http-client'
const iclient = ipfsClient("/ip4/127.0.0.1/tcp/5001")

export async function uploadContent([file]){
    try {
      const added = await iclient.add(file)
      return added 
    } catch (err) {
      console.error(err)
    }
    return ""
}

export async function uploadMetadata(md) {
    try {
        const added = await iclient.add(JSON.stringify(md))
        return added
    } catch (err) {
        console.error(err)
    }
    return {} 
}

export async function getMetaFromIpfs(meta_hash) {
    console.log(meta_hash)
    try {
        let data = "" 
        for await (const chunk of iclient.cat(meta_hash)) {
            data += new TextDecoder("utf-8").decode(chunk);
        }
        let parsed =  JSON.parse(data) 
        return parsed
    } catch (err) {
        console.error("Failed to get Metadata from IPFS:", err)
    }
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