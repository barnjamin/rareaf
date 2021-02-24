
/* eslint-disable no-console */

import { getMetaFromIpfs } from "./ipfs";

export async function connect(){
    try{
        await AlgoSigner.connect()
    }catch(err){
        alert("connect algosigner bro")
    }
}

export async function listTokens(){
    const assets = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets?name=RareAF&limit=100`,
    });
    return assets.assets
}

export async function getTokenCreatedAt(token_id){
    console.log(token_id)
    const asset = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets/${token_id}`,
    });
    console.log(asset.asset)
    return asset.asset['created-at-round']
}

export async function getTokenMetadata(token_id) {
    let meta = {}

    const tx = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets/${token_id}/transactions?limit=1&tx-type=acfg`
    });

    // Just take the first one
    const created_tx = tx.transactions[0]

    //Base64 decode it
    const data = atob(created_tx.note)

    console.log(data)
    if(data.length > 2 && data.substr(0,2) == '{"'  ) {
        try {
            meta = JSON.parse(data)
        }catch (err){
            console.error(err)
        }
        return meta
    }

    console.log(data.substr(9))
    return await getMetaFromIpfs(data.substr(9))
}

export async function deleteToken(token_id) {

}
