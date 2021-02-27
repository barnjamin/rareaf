/* eslint-disable no-console */

import ipfsClient from 'ipfs-http-client'

const iclient = ipfsClient("/ip4/127.0.0.1/tcp/5001")

export async function uploadContent([file]){
    try {
      const added = await iclient.add(file)
      console.log(added)
      return added.path
    } catch (err) {
      console.error(err)
    }
    return ""
}

export async function uploadMetadata(md) {
    try {
        const added = await iclient.add(JSON.stringify(md))
        return added.path
    } catch (err) {
        console.error(err)
    }
    return ""
}

export async function getMetaFromIpfs(meta_hash) {
    try {
        let data = "" 
        for await (const chunk of iclient.cat(meta_hash)) {
            data += new TextDecoder("utf-8").decode(chunk);
        }
        return JSON.parse(data) 
    } catch (err) {
        console.error("Failed to get Metadata from IPFS:", err)
    }
    return {}
}