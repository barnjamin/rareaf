/* eslint-disable no-console */
import { resolveMetadataFromMetaHash } from "./ipfs";
import { platform_settings as ps } from './platform-conf'
import {extract_vars} from './contracts'
import algosdk from 'algosdk'  
import Listing from "./listing";
import NFT from "./nft";


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

export async function getTags(){
    //TODO: Get any tags owned by this platform
    return []
}

export async function getListing(addr) {
    const tokens  = await getTokensFromListingAddress(addr)

    if(tokens.length==0){
        console.error("No nfts in that listing?")
        return 
    }

    const details = await getDetailsOfListing(addr)

    const vars    = extract_vars(details[2])
    const creator = algosdk.encodeAddress(vars['TMPL_CREATOR_ADDR'])
    
    const [cid, md] = await resolveMetadataFromMetaHash(tokens[0]['params']['metadata-hash'])

    let l = new Listing(details[0], tokens[0]['index'], creator, addr)
    l.nft = new NFT(md)
    l.nft.cid = cid
    return l
}

export async function getListings() {
    const indexer  = getIndexer()
    const balances = await indexer.lookupAssetBalances(ps.token.id).do()

    let listings = []
    for (let bidx in balances.balances) {
        const b = balances.balances[bidx]

        if (b.address == ps.address || b.amount == 0) continue;

        listings.push(await getListing(b.address))
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

        //TODO take out once indexer is fixed
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

export async function getNFT(asset_id){
    const token = await getToken(asset_id)
    const [cid, md]    = await resolveMetadataFromMetaHash(token['params']['metadata-hash'])
    const nft   = new NFT(md, asset_id)
    nft.meta_cid = cid
    return nft
}

export async function getTokenCreatedAt(asset_id) {
    const a = await getToken(asset_id)
    return a['created-at-round']
}

export async function get_asa_cfg_txn(withSuggested, from, asset, new_config) {
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

export async function get_asa_optin_txn(withSuggested, addr, id) {
    return get_asa_xfer_txn(withSuggested, addr, addr, id, 0)
}

export async function get_asa_xfer_txn(withSuggested, from, to, id, amt) {
    return addSuggested(withSuggested, {
        from: from,
        to: to,
        assetIndex: id,
        type: 'axfer',
        amount: amt,
    })
}


export async function get_asa_create_txn(withSuggested, addr, meta) {
    return addSuggested(withSuggested, {
        from: addr,
        assetManager: addr,
        assetName: meta.name,
        assetTotal: 1,
        assetDecimals: 0,
        assetMetadataHash:meta,
        type: 'acfg',
        assetName:"RareAF",
        assetUnitName:"RAF",
        assetURL: ps.domain,
    })
}

export async function get_asa_destroy_txn(withSuggested, addr, token_id) {
    return addSuggested(withSuggested, {
        from: addr, 
        assetIndex: token_id, 
        type: 'acfg' 
    })
}

export async function get_app_call_txn(withSuggested, addr, args) {
    return addSuggested(withSuggested, {
        from: addr,
        appArgs:args.map((a)=>{ return new Uint8Array(Buffer.from(a, 'base64'))}),
        appIndex:ps.application.id,
        type:"appl"
    })
}

export async function addSuggested(named, tmp){
    const suggestedParams = await getSuggested()

    if (named) {
        tmp.suggestedParams=suggestedParams
        return tmp
    }
        
    return  { ...tmp, ...suggestedParams }
}

export async function getSuggested(){
    const client = getAlgodClient();
    const txParams = await client.getTransactionParams().do();
    return { ...txParams, lastRound: txParams['firstRound'] + 10 }
}


export function uintToB64String(x){
    return Buffer.from(algosdk.encodeUint64(x)).toString('base64')
}

export async function sendWaitGroup(signed) {
    const client = getAlgodClient()
    const {txId}  = await client.sendRawTransaction(signed.map((t)=>{return t.blob})).do()
    return await waitForConfirmation(client, txId, 3)
}

export async function sendWait(signed){
    const client = getAlgodClient()
    await client.sendRawTransaction([signed.blob]).do()
    return await waitForConfirmation(client, signed.txID, 3)
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
      const pending = await algodclient
        .pendingTransactionInformation(txId)
        .do();

      if (pending !== undefined) {
        if ( pending['confirmed-round'] !== null && pending['confirmed-round'] > 0) 
          return pendingInfo;
  
        if ( pending['pool-error'] != null && pending['pool-error'].length > 0) 
          throw new Error( `Transaction Rejected pool error${pendingInfo['pool-error']}`);
      }
      await algodclient.statusAfterBlock(currentround).do();
      currentround += 1;
    }

    /* eslint-enable no-await-in-loop */
    throw new Error(`Transaction not confirmed after ${timeout} rounds!`);
}

export function download_txns(name, txns) {
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