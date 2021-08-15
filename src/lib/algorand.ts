/* eslint-disable no-console */
import {platform_settings as ps} from './platform-conf'
import algosdk, {LogicSigAccount} from 'algosdk'  
import Listing from "./listing";
import { NFT } from "./nft";
import { TagToken} from './tags'
import { dummy_addr, get_platform_owner } from './contracts'
import { showErrorToaster, showNetworkError, showNetworkSuccess, showNetworkWaiting } from "../Toaster";


type Holdings= {
    price: number
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

export async function getTags(): Promise<TagToken[]> {
    const indexer = getIndexer()
    const tags = await indexer
        .searchForAssets()
        .creator(ps.application.owner_addr)
        .unit(TagToken.getUnitName())
        .do()

    return tags.assets.map((t)=>{
        return new TagToken(t.params.name, t.index)
    })
}

export async function isOptedIntoApp(address: string): Promise<boolean> {
    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const optedIn = result['apps-local-state'].find((r)=>{ return r.id == ps.application.app_id })
    return optedIn !== undefined 
}

export async function isOptedIntoAsset(address: string, idx: number): Promise<boolean> {
    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const optedIn = result['assets'].find((r)=>{ return r['asset-id'] == idx })
    return optedIn !== undefined 
}

export async function isListing(address: string): Promise<boolean> {
    const client = getAlgodClient()
    const result = await client.accountInformation(address).do()
    const hasPriceToken = result['assets'].find((r)=>{ return r['asset-id'] == ps.application.price_id })
    return hasPriceToken !== undefined
}

export async function getListings(tagName: string, minPrice=0, maxPrice=0): Promise<Listing[]> {
    const indexer  = getIndexer()

    let token_id = ps.application.price_id

    if(tagName !== undefined){
        const tag = new TagToken(tagName)
        const tt = await getTagToken(tag.getTokenName())
        if (tt.id == 0) return []
        token_id = tt.id
    }

    let lookup = indexer.lookupAssetBalances(token_id)
    if(tagName !== undefined){
        lookup = lookup.currencyGreaterThan(0)
    }else{
        if(maxPrice>0) lookup = lookup.currencyLessThan(maxPrice) 
        lookup = lookup.currencyGreaterThan(minPrice)
    }

    const balances =  await lookup.do()

    const lp = []
    const listings = []
    for (let bidx in balances.balances) {
        const b = balances.balances[bidx]

        if (b.address == ps.application.owner_addr || b.amount == 0) continue;

        lp.push(getListing(b.address).then((listing)=>{
             listings.push(listing)
        }))
    }

    await Promise.all(lp)

    return listings
}

export async function getTagToken(name: string): Promise<TagToken> {
    const indexer  = getIndexer()
    const assets = await indexer.searchForAssets().name(name).do()

    for(let aidx in assets.assets){
        if(assets.assets[aidx].params.creator == ps.application.owner_addr)
            return new TagToken(name, assets.assets[aidx].index)
    }

    return new TagToken(name)
}


export async function getPortfolio(addr: string): Promise<Portfolio> {
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
        if(als.id !== ps.application.app_id) continue

        for(let kidx in als['key-value']) {
            const kv = als['key-value'][kidx]
            lp.push(getListing(b64ToAddr(kv.key)).then((listing)=>{
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

export async function getListing(addr: string): Promise<Listing> {
    const holdings  = await getHoldingsFromListingAddress(addr)
    if(holdings.nft === undefined) return undefined;

    const creator  = await getCreator(addr, holdings.nft.asset_id)

    let l = new Listing(holdings.price, holdings.nft.asset_id, creator, addr)
    l.tags = holdings.tags
    l.nft = holdings.nft

    return l
}

export async function getHoldingsFromListingAddress(address: string): Promise<Holdings> {
    const client   = getAlgodClient()
    const account = await client.accountInformation(address).do()
    const holdings  = { 'price':0, 'tags':[], 'nft':undefined, }

    const gets = []
    for (let aid in account.assets) {
        const asa = account.assets[aid]

        if(asa['asset-id'] == ps.application.price_id){
            holdings.price = asa['amount']
            continue
        }

        gets.push(getToken(asa['asset-id']).then(async (token)=>{
            if(token.params.creator == ps.application.owner_addr) holdings.tags.push(TagToken.fromAsset(token))
            else holdings.nft = await NFT.fromToken(token)
        }))
    }

    await Promise.all(gets)

    return holdings
}

export async function getListingAddr(asset_id: number): Promise<string> {
    const owner = await getOwner(asset_id)
    if (owner !== "" && await isListing(owner)){
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