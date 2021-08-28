/* eslint-disable no-console */
import {platform_settings as ps} from './platform-conf'
import algosdk, {LogicSigAccount} from 'algosdk'  
import Listing from "./listing";
import { NFT } from "./nft";
import { TagToken} from './tags'
import { dummy_addr } from './contracts'
import { ApplicationConfiguration } from './application-configuration';
import { showErrorToaster, showNetworkError, showNetworkSuccess, showNetworkWaiting } from "../Toaster";
import { ProofResponse } from 'algosdk/dist/types/src/client/v2/algod/models/types';
import { match } from 'ts-mockito';
import { PriceToken } from './price';


type Holdings= {
    price: number
    price_id: number
    tags: TagToken[]
    nft: NFT
};

type Portfolio = {
    listings: Listing[]
    nfts: NFT[]
}

let client = undefined;
export function getAlgodClient(){
    if(client===undefined){
        const {token, server, port} = ps.algod
        client = new algosdk.Algodv2(token, server, port)
    }
    return client
}

let indexer = undefined;
export function getIndexer() {
    if(indexer===undefined){
        const {token, server, port} = ps.indexer
        indexer = new algosdk.Indexer(token, server, port)
    }
    return indexer
}

export async function getLogicFromTransaction(addr: string): Promise<LogicSigAccount> {
    const indexer = getIndexer()
    const txns = await indexer.searchForTransactions()
        .address(addr).do()

    for(let tidx in txns.transactions){
        const txn = txns.transactions[tidx]
        if(txn.sender == addr){
            const program_bytes = new Uint8Array(Buffer.from(txn.signature.logicsig.logic, "base64"));
            return new LogicSigAccount(program_bytes);
        }
    }
    return undefined
}

export async function getTags(ac: ApplicationConfiguration, owner: string, unit: string): Promise<TagToken[]> {
    const client = getAlgodClient()
    const results =  await client 
        .accountInformation(owner)
        .do()

    const name = TagToken.getUnitName(unit)
    return results['created-assets'].filter((a)=>{
        return a.params['unit-name'] == name 
    }).map((t)=>{
        return new TagToken(ac, t.params.name, t.index)
    })
}

export async function getGlobalState(app_id: number): Promise<any> {
    const client = getAlgodClient()
    const result = await client.getApplicationByID(app_id).do()
    return result['params']['global-state']
}

export async function isOptedIntoApp(ac: ApplicationConfiguration, address: string): Promise<boolean> {
    if(address === "" || address === undefined) return false;

    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const optedIn = result['apps-local-state'].find((r)=>{ return r.id == ac.id })
    return optedIn !== undefined 
}

export async function isOptedIntoAsset(address: string, idx: number): Promise<boolean> {
    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const optedIn = result['assets'].find((r)=>{ return r['asset-id'] == idx })
    return optedIn !== undefined 
}

export async function isListing(ac: ApplicationConfiguration, address: string): Promise<boolean> {
    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const hasPriceToken = result['assets'].find((r)=>{ return ac.price_ids.includes(r['asset-id'])  })
    return hasPriceToken !== undefined
}

export async function getListings(ac: ApplicationConfiguration, price_tokens: number[], tagNames: string[], minPrice=0, maxPrice=0): Promise<Listing[]> {
    const indexer  = getIndexer()

    // App conf not initialized
    if(ac.price_ids.length === 0) return []

    // Use tag names first
    if(tagNames.length>0) {
        const matching = ac.tags.filter((t)=>{ return tagNames.includes(t.name) }).map((t)=>{ return t.id })
        if(matching.length === 0) return []

        const allBalances = await Promise.all(matching.map((id)=>{
             return indexer.lookupAssetBalances(id).currencyGreaterThan(0).do()
        }))

        const balances = [].concat(...allBalances.map((b)=>{ return b.balances }))
        
        return await Promise.all(balances.filter((b)=>{
            return b.address !== ac.owner_addr && b.amount > 0
        }).map((b)=>{
            return getListing(ac, b.address)
        }))
    }

    //Set to the default if none are set
    if(price_tokens.length==0){
        price_tokens.push(ac.price_ids[0])
    }

    const allBalances = await Promise.all(price_tokens.map((id)=>{
        let lookup =  indexer.lookupAssetBalances(id).currencyGreaterThan(minPrice)
        if(maxPrice>0) lookup = lookup.currencyLessThan(maxPrice) 
        return lookup.do()
    }))

    const price_balances = [].concat(...allBalances.map((b)=>{ return b.balances }))
    
    return await Promise.all(price_balances.filter((b)=>{
        return b.address !== ac.owner_addr && b.amount > 0
    }).map((b)=>{
        return getListing(ac, b.address)
    }))
}

export async function getTagToken(ac: ApplicationConfiguration, name: string): Promise<TagToken> {
    const indexer  = getIndexer()
    const assets = await indexer.searchForAssets().name(name).do()

    for(let aidx in assets.assets){
        if(assets.assets[aidx].params.creator == ac.owner_addr)
            return new TagToken(ac, name, assets.assets[aidx].index)
    }

    return new TagToken(ac, name)
}

export async function getPriceTokens(ac: ApplicationConfiguration): Promise<PriceToken[]> {
    const client = getAlgodClient()
    const results =  await client 
        .accountInformation(ac.owner_addr)
        .do()

    const name = PriceToken.getUnitName(ac.unit)

    return Promise.all(results['created-assets'].filter((a)=>{
        return a.params['unit-name'] == name 
    }).map((t)=>{
        return new PriceToken(ac, t.params.name, t.index)
    }).map((pt)=>{
        return pt.populateDetails()
    }))
}



export async function getPortfolio(ac: ApplicationConfiguration, addr: string): Promise<Portfolio> {
    const client = getAlgodClient()
    const portfolio: Portfolio = {listings:[], nfts:[]}
    let acct = undefined

    try{
        acct = await client.accountInformation(addr).do()
    }catch(error){
        return portfolio
    }

    const lp = []
    for(let aidx in acct['apps-local-state']){
        const als = acct['apps-local-state'][aidx]
        if(als.id !== ac.id) continue

        for(let kidx in als['key-value']) {
            const kv = als['key-value'][kidx]
            lp.push(getListing(ac, b64ToAddr(kv.key)).then((listing)=>{
                if(listing!==undefined) portfolio.listings.push(listing)
            }))
        }
    }
    await Promise.all(lp)

    const np = []
    for(let aidx in acct['assets']) {
        const ass = acct['assets'][aidx]
        if (ass.amount !== 1) continue

        try{
            np.push(tryGetNFT(ass['asset-id']).then((nft)=>{
                if (nft !== undefined) portfolio.nfts.push(nft)
            }))
        }catch(error){
            showErrorToaster("couldn't parse nft for asset:"+ass['asset-id'])
        }
    }
    await Promise.all(np)

    return portfolio
}

export async function getListing(ac: ApplicationConfiguration, addr: string): Promise<Listing> {
    const holdings  = await getHoldingsFromListingAddress(ac, addr)

    if(holdings.nft === undefined) return undefined;

    const creator  = await getCreator(addr, holdings.nft.asset_id)

    let l = new Listing(holdings.price, holdings.price_id, holdings.nft.asset_id, creator, ac, addr)
    l.tags = holdings.tags
    l.nft = holdings.nft

    return l
}

export async function getHoldingsFromListingAddress(ac: ApplicationConfiguration, address: string): Promise<Holdings> {
    const client   = getAlgodClient()
    const account = await client.accountInformation(address).do()
    const holdings  = { 'price':0, 'tags':[], 'nft':undefined, 'price_id':0}

    const gets = []
    for (let aid in account.assets) {
        const asa = account.assets[aid]

        if(ac.price_ids.includes(asa['asset-id'])){
            holdings.price = asa['amount']
            holdings.price_id = asa['asset-id']
            continue
        }

        gets.push(getToken(asa['asset-id']).then(async (token)=>{
            if(token.params.creator == ac.owner_addr) holdings.tags.push(TagToken.fromAsset(token))
            else holdings.nft = await NFT.fromToken(token)
        }))
    }

    await Promise.all(gets)

    return holdings
}

export async function getListingAddr(ac: ApplicationConfiguration, asset_id: number): Promise<string> {
    const owner = await getOwner(asset_id)
    if (owner !== "" && await isListing(ac, owner)){
        return owner
    }
    return ""
}

export async function tryGetNFT(asset_id: number): Promise<NFT> {
    try {
        const token = await getToken(asset_id)
        return await NFT.fromToken(token)
    } catch (error) { 
        showErrorToaster("Cant find asset_id" + asset_id + ": " + error)
    }

    return undefined 
}

export async function getToken(asset_id: number): Promise<any> {
    const client = getAlgodClient()
    return await client.getAssetByID(asset_id).do()
}

export async function getOwner(asset_id: number):Promise<string> {
    const client = getIndexer()
    const balances = await client.lookupAssetBalances(asset_id).currencyGreaterThan(0).do()

    //TODO: when js-sdk take out
    const holders = []
    for(const idx in balances['balances']){
        const bal = balances['balances'][idx]
        if(bal.amount>0){
            holders.push(bal.address)
        }
    }

    if(holders.length==1){
        return holders[0]
    }
    return ""
}

export async function getCreator(addr: string, asset_id: number): Promise<string> {
    // Find the txn that xfered the asa to this addr, sender is creator
    const indexer = getIndexer()

    const txns = await indexer
        .searchForTransactions()
        .address(addr)
        .currencyGreaterThan(0)
        .assetID(asset_id)
        .do()

    console.log(asset_id, addr)
    for(let idx in txns.transactions){
        const txn = txns.transactions[idx]
        if(txn.sender != addr){
            return txn.sender
        }
    }
}

export async function getSuggested(rounds){
    const client = getAlgodClient();
    const txParams = await client.getTransactionParams().do();
    return { ...txParams, lastRound: txParams['firstRound'] + rounds }
}


export function uintToB64(x: number): string {
    return Buffer.from(algosdk.encodeUint64(x)).toString('base64')
}

export function addrToB64(addr: string): string {
    if (addr == "" ){
        return dummy_addr
    }
    try {
        const dec = algosdk.decodeAddress(addr)
        return "b64("+Buffer.from(dec.publicKey).toString('base64')+")"
    }catch(err){
        return dummy_addr
    }
}
export function b64ToAddr(x){
    return algosdk.encodeAddress(new Uint8Array(Buffer.from(x, "base64")));
}

export async function sendWait(signed: any[]): Promise<any> {
    const client = getAlgodClient()


    if(ps.dev.debug_txns) download_txns("grouped.txns", signed.map((t)=>{return t.blob}))


    try {
        const {txId}  = await client.sendRawTransaction(signed.map((t)=>{return t.blob})).do()
        showNetworkWaiting(txId)

        const result = await waitForConfirmation(client, txId, 3)
        showNetworkSuccess(txId)

        return result 
    } catch (error) { 
        showNetworkError("", error) 
    }

    return undefined 
}


export async function getTransaction(txid: string) {
    return await waitForConfirmation(getAlgodClient(), txid, 3)
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
          return pending;
  
        if ( pending['pool-error'] != null && pending['pool-error'].length > 0) 
          throw new Error( `Transaction Rejected pool error${pending['pool-error']}`);
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

export function concatTypedArrays(a, b) { // a, b TypedArray of same type
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}