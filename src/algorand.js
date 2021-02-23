
/* eslint-disable no-console */

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
    return asset.asset.['created-at-round']
}

export async function getTokenMetadata(token_id) {

    const created_at = await getTokenCreatedAt(token_id)

    const tx = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets/${token_id}/transactions?max-round=${created_at}`
    });

    let created_tx = tx.transactions[0]
    // Just return the first one
    let meta = {}
    try {
        meta = JSON.parse(atob(created_tx.note))
    }catch (err){
        console.error(err)
    }
    console.log(meta)
    return meta
}


