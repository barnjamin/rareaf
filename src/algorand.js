
/* eslint-disable no-console */

import { getMetaFromIpfs } from "./ipfs";


export async function isAlgorandWalletConnected(){
    if(typeof AlgoSigner === 'undefined') {
        return false
    }

    try{
        await getAccount()
        return true
    }catch(err){
        return false
    }
}
export async function algoConnectWallet(){
    if(typeof AlgoSigner === 'undefined') {
        alert('Make Sure AlgoSigner wallet is installed and connected');
    }

    try{
        await AlgoSigner.connect()
    }catch(err){ console.log("Failed to connect: ", err) }
}

export async function listTokens(){
    const assets = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets?name=RareAF&limit=100`,
    });
    return assets.assets
}

//export async function updateMetadata(){ }
export async function getTokenCreatedAt(token_id){
    const asset = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets/${token_id}`,
    });
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

    //If its a json object, just decode it
    if(data.length > 2 && data.substr(0,2) == '{"'  ) {
        try {
            meta = JSON.parse(data)
        }catch (err){ console.error(err) }
        return meta
    }

    //Otherwise get it from ipfs directly
    return await getMetaFromIpfs(data)
}

export async function getAccount(){
    //TODO: select box to pick which acct to use
    let accts = await AlgoSigner.accounts({ ledger: 'TestNet' })
    return accts[0]["address"]
}

export async function createToken(meta_hash) {
    const acct = getAccount()

    let txParams = await AlgoSigner.algod({ ledger: 'TestNet', path: '/v2/transactions/params' })

    let signedTx = await AlgoSigner.sign({
        from: acct,
        assetManager: acct,
        assetFreeze: acct,
        assetClawback: acct,
        assetName: "RareAF",
        assetUnitName: "RAF",
        assetTotal: 1,
        assetDecimals: 0,
        note: meta_hash,
        type: 'acfg',
        fee: txParams['min-fee'],
        firstRound: txParams['last-round'],
        lastRound: txParams['last-round'] + 1000,
        genesisID: txParams['genesis-id'],
        genesisHash: txParams['genesis-hash'],
        assetURL: "rare.af/"
    });

    try{
        await AlgoSigner.send({ ledger: 'TestNet', tx: signedTx.blob })
    }catch(err){
        console.error(err)
    }
}

export async function destroyToken(token_id) {
    let accts = await AlgoSigner.accounts({ ledger: 'TestNet' })
    const acct = accts[0]["address"]
    let txParams = await AlgoSigner.algod({ ledger: 'TestNet', path: '/v2/transactions/params' })
    let signedTx = await AlgoSigner.sign({
        from: acct,
        assetIndex : token_id,
        type: 'acfg',
        fee: txParams['min-fee'],
        firstRound: txParams['last-round'],
        lastRound: txParams['last-round'] + 1000,
        genesisHash: txParams['genesis-hash'],
        genesisID: txParams['genesis-id']
    });

    try{
        await AlgoSigner.send({ ledger: 'TestNet', tx: signedTx.blob })
    }catch(err){console.error(err)}
}
