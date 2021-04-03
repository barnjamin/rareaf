
/* eslint-disable no-console */
import { getMetaFromIpfs } from "./ipfs";


//const network = "TestNet"
const network = "sandnet"
const platform_token = 1
const platform_account = "7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM"

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
    }catch(err){ console.error("Failed to connect: ", err) }
}

export async function getListings(){
    const balances = await AlgoSigner.indexer({
        ledger: network,
        path: `/v2/assets/${platform_token}/balances?currency-greater-than=0`,
    });

    let listings = []
    for(let bidx in balances.balances){
        const b = balances.balances[bidx]
        if(b.address==platform_account || b.amount == 0) continue;


        const acct_resp = await AlgoSigner.indexer({
            ledger:network,
            path:`/v2/accounts/${b.address}`
        });

        console.log(acct_resp)
        for(let aid in acct_resp.account.assets){
            const asa = acct_resp.account.assets[aid]
            if(asa['asset-id'] == platform_token) continue;
            const token =  await getToken(asa['asset-id'])
            listings.push(token)
        }
    }

    return listings
}

export async function getToken(asset_id){
    const assets = await AlgoSigner.indexer({
        ledger: network,
        path: `/v2/assets/${asset_id}`,
    });
    return assets.asset
}

export async function getTokenCreatedAt(asset_id){
    const a = await getToken(asset_id)
    return a['created-at-round']
}

export async function getTokenMetadataFromTransaction(token_id) {
    const tx = await AlgoSigner.indexer({
        ledger: network,
        path: `/v2/assets/${token_id}/transactions?limit=1&tx-type=acfg`
    });

    // Just take the first one
    const created_tx = tx.transactions[0]

    if(created_tx.note === undefined || created_tx.note.length==0){
        return {}
    }

    //Base64 decode it
    const data = atob(created_tx.note)

    //If its a json object, just decode it
    if(data.length > 2 && data.substr(0,2) == '{"'  ) {
        try {
            return JSON.parse(data)
        }catch (err){ console.error(err) }
    }

    const d = data.split(",")
    const meta = d[d.length-1]

    //Otherwise get it from ipfs directly
    return await getMetaFromIpfs(data)
}

export async function getAccount(){
    //TODO: select box to pick which acct to use
    let accts = await AlgoSigner.accounts({ ledger: network })
    return accts[0]["address"]
}

export async function createToken(meta_cid) {
    const acct = await getAccount()
    const txParams = await AlgoSigner.algod({ledger: network, path: '/v2/transactions/params' })
    const signedTx = await AlgoSigner.sign({
        from: acct,
        assetManager: acct,
        assetName: "RareAF",
        assetUnitName: "RAF",
        assetTotal: 1,
        assetDecimals: 0,
        assetMetadataHash:Array.from(meta_cid.cid.multihash.subarray(2)),
        type: 'acfg',
        fee: txParams['min-fee'],
        firstRound: txParams['last-round'],
        lastRound: txParams['last-round'] + 1000,
        genesisID: txParams['genesis-id'],
        genesisHash: txParams['genesis-hash'],
        assetURL: "rare.af/"
    });

    let tx;
    try{
        tx = await AlgoSigner.send({ ledger: network, tx: signedTx.blob })
    }catch(err){
        //TODO: alert error
        console.error(err)
        return
    }

    await checkCompleted(tx)
}


export async function checkCompleted(tx) {
    let completed = false;
    while (!completed) {
        try{
            const result = await AlgoSigner.algod({ ledger: network, path: '/v2/transactions/pending/' + tx.txId })
            if(result['pool-error']!=""){
                console.error(result['pool-error'])
                return
            }

            if(result['confirmed-round']!== undefined && result['confirmed-round']>0 ){
                completed=true
            }
        }catch(err){
            console.error(err)
            return
        }
    }
}


export async function destroyToken(token_id) {
    let accts = await AlgoSigner.accounts({ ledger: network })
    const acct = accts[0]["address"]
    let txParams = await AlgoSigner.algod({ ledger: network, path: '/v2/transactions/params' })
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
        const tx = await AlgoSigner.send({ ledger: network, tx: signedTx.blob })
        await checkCompleted(tx)
    }catch(err){console.error(err)}
}
