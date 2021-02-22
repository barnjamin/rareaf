/* eslint-disable no-console */

const ipfsClient = require('ipfs-http-client')

const iclient = ipfsClient("/ip4/127.0.0.1/tcp/5001")

export async function uploadConent([file]){
    try {
      const added = await this.state.ipfs.add(
        file, { progress: (prog) => console.log(`received: ${prog}`) }
      )
      return added.cid.toString()
    } catch (err) {
      console.error(err)
    }
    return ""
}

export async function uploadMetadata(md) {
    try {
        const added = await iclient.add(JSON.stringify(md))
        return added.cid.toString()
    } catch (err) {
        console.error(err)
    }
    return ""
}

export async function getMetaFromIpfs(meta_hash) {
    try {
        const meta_string = await iclient.get(meta_hash)
        return JSON.parse(meta_string) 
    } catch (err) {
        console.error(err)
    }
    return {}
}