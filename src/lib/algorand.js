/* eslint-disable no-console */
import { resolveMetadataFromMetaHash } from "./ipfs";
import { platform_settings as ps } from './platform-conf'
import algosdk from 'algosdk'  
import { add } from "ipfs-http-client/src/pin/remote/service";



let client = undefined;
export function getAlgodClient(){
    if(client===undefined){
        const {token, server, port} = ps.algod
        client = new algosdk.Algodv2(token, server, port)
    }
    return client
}

let indexer = undefined;
export function getIndexer(){
    if(indexer===undefined){
        const {token, server, port} = ps.indexer
        indexer = new algosdk.Indexer(token, server, port)
    }
    return indexer
}

export async function getListings() {
    const indexer = getIndexer()
    const balances = await indexer.lookupAssetBalances(ps.token.id).do()

    let listings = []
    for (let bidx in balances.balances) {
        const b = balances.balances[bidx]
        if (b.address == ps.address || b.amount == 0) continue;
        const tokens = await getTokensFromListingAddress(b.address)
        const details = await getDetailsOfListing(b.address)

        let metas = []
        for(let tid in tokens){
            const token = tokens[tid]
            metas.push(await resolveMetadataFromMetaHash(token['params']['metadata-hash']))
        }

        listings.push({
            address: b.address, 
            token:tokens[0], 
            details:details, 
            meta:metas[0]
        })
    }

    return listings
}

export async function getTokensFromListingAddress(address) {
    const indexer = getIndexer()
    const acct_resp = await indexer.lookupAccountByID(address).do()

    let listings = []
    for (let aid in acct_resp.account.assets) {
        const asa = acct_resp.account.assets[aid]
        if (asa['asset-id'] == ps.token.id) continue;

        const token = await getToken(asa['asset-id'])
        listings.push(token)
    }
    return listings
}

export async function getDetailsOfListing(address) {
    const indexer = getIndexer()
    const txnsearch = indexer.searchForTransactions()
    txnsearch.address(address)
    txnsearch.assetID(ps.token.id)
    const txn_resp = await txnsearch.do()


    for(let idx in txn_resp.transactions) {
        const txn = txn_resp.transactions[idx]
        if (txn['asset-transfer-transaction'].amount==0) continue

        return txn.signature.logicsig.args.map((a)=>{
            const raw_bytes = Buffer.from(a, 'base64')
            if(raw_bytes.length==8) return algosdk.decodeUint64(raw_bytes)
            return raw_bytes
        })
    }
    return []
}

export async function getToken(asset_id) {
    const indexer = getIndexer()
    const assets = await indexer.lookupAssetByID(asset_id).do()
    return assets.asset
}

export async function getTokenCreatedAt(asset_id) {
    const a = await getToken(asset_id)
    return a['created-at-round']
}

export async function populate_contract(template, variables) {
    //Read the program, Swap vars, spit out the filled out tmplate
    let program = await get_teal(template)
    for (let v in variables) {
        program = program.replace("$" + v, variables[v])
    }
    return program
}

export async function get_teal(program) {
    return await fetch(program)
        .then(response => checkStatus(response) && response.arrayBuffer())
        .then(buffer => {
            const td = new TextDecoder()
            return td.decode(buffer)
        }).catch(err => console.error(err));
}

function checkStatus(response) {
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    return response;
}

export async function get_asa_cfg(withSuggested, from, asset, new_config) {
    return addSuggested(withSuggested, {
        from: from,
        assetIndex: asset,
        type: 'acfg',
        ...new_config
    })
}

export async function get_pay_txn(withSuggested, from, to, amount) {
    return addSuggested(withSuggested, {
        from: from,
        to: to,
        type: 'pay',
        amount: amount,
    })
}

export async function get_optin_txn(withSuggested, addr, id) {
    return get_asa_txn(withSuggested, addr, addr, id, 0)
}


export async function get_asa_txn(withSuggested, from, to, id, amt) {
    return addSuggested(withSuggested, {
        from: from,
        to: to,
        assetIndex: id,
        type: 'axfer',
        amount: amt,
    })
}

export async function create_asa_txn(withSuggested, addr, meta) {
    return addSuggested(withSuggested, {
        from: addr,
        assetManager: addr,
        assetName: meta.name,
        assetTotal: 1,
        assetDecimals: 0,
        assetMetadataHash: Array.from(meta.cid.multihash.subarray(2)),
        type: 'acfg',
        assetURL: "rare.af/",
    })
}

export async function destroy_asa_txn(withSuggested, addr, token_id) {
    return addSuggested(withSuggested, {
        from: addr, 
        assetIndex: token_id, 
        type: 'acfg' 
    })
}

export async function addSuggested(named, tmp){
    const suggestedParams = getSuggested()

    if (named)
        return tmp.suggestedParams=suggestedParams
        
    return  { ...tmp, ...suggestedParams }
}

export async function getSuggested(){
    const client = getAlgodClient();
    const txParams = await client.getTransactionParams().do();

    return {
        fee: txParams['min-fee'],
        firstRound: txParams['last-round'],
        lastRound: txParams['last-round'] + 10,
        genesisID: txParams['genesis-id'],
        genesisHash: txParams['genesis-hash']
    }
}

export async function sendWait(signed){
    const client = getAlgodClient()
    await client.sendRawTransaction([signed.blob]).do()
    await waitForConfirmation(client, signed.txID, 3)
}

export async function waitForConfirmation(algodclient, txId, timeout) {
    if (algodclient == null || txId == null || timeout < 0) {
      throw new Error('Bad arguments.');
    }

    const status = await algodclient.status().do();
    if (typeof status === 'undefined')
      throw new Error('Unable to get node status');

    const startround = status['last-round'] + 1;
    let currentround = startround;
  
    /* eslint-disable no-await-in-loop */
    while (currentround < startround + timeout) {
      const pendingInfo = await algodclient
        .pendingTransactionInformation(txId)
        .do();

      if (pendingInfo !== undefined) {
        if (
          pendingInfo['confirmed-round'] !== null &&
          pendingInfo['confirmed-round'] > 0
        ) {
          // Got the completed Transaction
          return pendingInfo;
        }
  
        if (
          pendingInfo['pool-error'] != null &&
          pendingInfo['pool-error'].length > 0
        ) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error(
            `Transaction Rejected pool error${pendingInfo['pool-error']}`
          );
        }
      }
      await algodclient.statusAfterBlock(currentround).do();
      currentround += 1;
    }

    /* eslint-enable no-await-in-loop */
    throw new Error(`Transaction not confirmed after ${timeout} rounds!`);
}


function download_txns(name, txns) {
    let b = new Uint8Array(0);
    for(const txn in txns){
        b = concatTypedArrays(b, txns[txn])
    }
    var blob = new Blob([b], {type: "application/octet-stream"});

    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = name;
    link.click();
}

function concatTypedArrays(a, b) { // a, b TypedArray of same type
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}
