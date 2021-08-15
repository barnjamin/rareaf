import register from 'ignore-styles'
register(['.scss', '.teal'])

import { expect } from 'chai';
import { platform_settings as ps } from '../src/lib/platform-conf';
import 'mocha';

import {uintToB64, addrToB64, getListing} from '../src/lib/algorand'
import Listing from '../src/lib/listing';
import {Application} from '../src/lib/application';
import {TagToken} from '../src/lib/tags';

import {SignedTxn, Wallet} from 'algorand-session-wallet';
import { storeNFT } from '../src/lib/ipfs';
import { emptyMetadata, NFT, NFTMetadata } from '../src/lib/nft';
import { get_listing_hash, get_listing_compiled } from '../src/lib/contracts';
import algosdk, { Transaction } from 'algosdk';
import {File} from 'nft.storage'

const admin_addr = ""
const listing_addr =  "3ESDM4QRMD4DJ43NURUBLWRSUBY4RYL6WPEPU77QFJSYX6KKCBVZFR6ZCM"
const creator_addr = ""
const asset_id = 0
const price = 10000



class TestingWallet implements Wallet {
  accounts: string[];
  defaultAccount: number;
  network: string;

  mnemonic: string


  constructor(){
    this.accounts =  ["VUKHGKWZDTBHDH6UPGHFYP2LL574OALDCSYI7EFYHURGZGHSMZLEODQORY"]
    this.mnemonic = "end captain piece offer math panda spirit potato human asthma catch orange absent execute intact weekend antenna profit balcony inmate basic ice useful abandon summer"

  }
  displayName(): string {
    return "TestWallet"
  }
  img(inverted: boolean): string {
    return ""
  }
  connect(settings?: any): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  isConnected(): boolean {
    throw new Error('Method not implemented.');
  }
  getDefaultAccount(): string {
    throw new Error('Method not implemented.');
  }
  signBytes(b: Uint8Array): Promise<Uint8Array> {
    throw new Error('Method not implemented.');
  }
  signTeal(teal: Uint8Array): Promise<Uint8Array> {
    throw new Error('Method not implemented.');
  }
  async signTxn(txns: Transaction[]): Promise<SignedTxn[]> {
    const sk = algosdk.mnemonicToSecretKey(this.mnemonic)

    const signed = [];
    const defaultAddr = this.accounts[0] 

    for(const txidx in txns){
        if(!txns[txidx]) continue

        const addr = algosdk.encodeAddress(txns[txidx].from.publicKey)
        if(addr === defaultAddr){
            signed.push(algosdk.signTransaction(txns[txidx], sk.sk))
        }else{
            signed.push({txID:"", blob:new Uint8Array()})
        }
    }
    return signed
  }
}

const wallet = new TestingWallet()

// Application
//describe('Application', ()=>{
//  describe('Create', async ()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const app = new Application(ps.application)
//    const conf = await app.create(wallet)
//    it("Should have new app id", ()=>{
//      expect(conf.app_id).to.equal(ps.application.app_id)
//    })
//    it("Should have the admin address", ()=>{
//      expect(conf.admin_addr).to.equal(ps.application.admin_addr)
//    })
//  })
//  describe('Destroy', async ()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const app = new Application(ps.application)
//    const conf = await app.destroyApplication(wallet)
//    it("Should have blanked out settings", ()=>{
//      expect(conf.app_id).to.equal(0)
//      expect(conf.owner_addr).to.equal("")
//      expect(conf.price_id).to.equal(0)
//    })
//  })
//  describe('Update', async ()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const app = new Application(ps.application)
//    await app.updateApplication(wallet)
//  })
//})
//
//
//// App specific Tags
//describe('Tags', ()=>{
//  describe('Create', async ()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const tag = new TagToken("test-tag")
//    const id = await tag.create(wallet)
//    it("Should create tag", ()=>{
//      expect(id).to.be.above(0)
//    })
//  })
//  describe('Destroy', async ()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const tag = new TagToken("test-tag")
//    const success = await tag.destroy(wallet)
//    it("Should destroy tag", ()=>{
//      expect(success).to.equal(true)
//    })
//  })
//})


const img = "iVBORw0KGgoAAAANSUhEUgAAABwAAAAjCAYAAACHIWrsAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALNSURBVFhH7ZVZTxNRGIb9mV4ZE/VGvXBJXBLXuMUtgkZRwSiKCAFBbNgUFGQtlLYsslaIQJfZzsx02k5bSl+/045BQgdK2xhjeJNJJpM5efLMfOc9+/CXswcsef5tYDpl3RSRHYGyLwFXlYquCwJ6rwjwPFMQGIxiLbpuvbG7bAtc6I6g4aAfjuMBdJ0Pof+GCPcjGdMvGZY/6kiw3SvbAqX5BGr3r6DpiB/tp4LouSzAeU/CxFMFC29VrBCQDUWAXYraAvvKFNQfWIXjWACfz4UwQHauciljt9igItQZhjZgICWuWSvyiy2w4ZAfTYf9aDtJdpcEDN+VME528zUMKy06pC8GIqNRJHxxa0V+yQlcX0tn7FqOkt3ZEPquCRgrl/H9hUJ2GgLtOrT+CEwPAedMa1V+sTVsPR1E24kgvl4kuzsSvE9kzNWoWP6gQeo2YIxYwMUSGPJM1On4dCZIdiJGH0hkx/CjXiW7MNQ+A3FvLANMySX6h1EphR7ad0O3RbJTMPeG4WezBrErDMOZ+3MmjJ1H1hbIw2jTewg2WamQnQZ/q052G7B0PG29mY33lWrd2WdbIE+SGkXymgj2GFBoUGLTZs6tEHCb6L8uIjQWs57kzo7AfOOkKeaff6KSIWVuNv8zJQEuUgXy2nOVyZh8rkB02VsWDYxRn/JS58XgeSxjtlrNNFFSy92zRQOnG3UM3MzaTVUxLNRSz1ITabRtcqUooEJT3HtVzNZehYKZaoalxmwT8WlOsa3DVRTQTUbcjtfeVJUC37vsKcKbKDwcQXxma+0VDPSPxshOwMh9qr0Kqr3XKpbeawh1hMG+GTDd0WwTCZstCwKmqVAG6WwcvEV2D3mpM/jqVKw6+Cmy0USZazyKdHJjmxQE9HUamY51kh0/kGd57TXpCHbQv+PlQHa/u5ZfyeWEtbLIf1hI9oAlzx6w5PnfgcAvcHnfAMSDd5sAAAAASUVORK5CYII="

// NFT
describe('NFT', ()=>{
  let nft: NFT = undefined

  describe('Mint', ()=>{
    const file = new File(new Array(Buffer.from(img, "base64")),  "favicon.ico", {type:"image/jpg"})

    const meta = emptyMetadata()
    meta.name = "Test"
    meta.description = "Test Metadata"
    meta.properties = {
      file:{ name: file.name, type: file.type, size: file.size, },
      artist: "rareaf",
    }
    let result: any = undefined

    it("Should upload", async ()=>{
      result = await storeNFT(file, meta)
      expect(result.url).to.include("ipfs://")
    })

    it("Should create a token", async ()=>{
      nft = new NFT(meta)
      nft.url = result.url
      const res = nft.createToken(wallet)
      expect(res).to.contain('asset-id')
    })

  })

  //describe ('Destroy', async ()=>{ 
  //    const res = nft.destroyToken(wallet)
  //    expect(res).to.contain('asset-id')
  //})
})


// Listing
//describe('Listings', ()=>{
//  describe('Create', async ()=>{
//    await wallet.connect(ps.dev.accounts)
//    const listing = new Listing(price, asset_id, creator_addr)
//    await listing.doCreate(wallet)
//  })
//
//  describe('Add Tag', async()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const listing = new Listing(price, asset_id, creator_addr)
//    const tag  = new TagToken("test-tag", 10)
//    await listing.doTag(wallet, tag, true)
//  })
//
//  describe('Remove Tag', async()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const listing = new Listing(price, asset_id, creator_addr)
//    const tag  = new TagToken("test-tag", 10)
//    await listing.doTag(wallet, tag, true)
//  })
//
//  describe('Destroy', async()=>{ 
//    await wallet.connect(ps.dev.accounts)
//    const listing = new Listing(price, asset_id, creator_addr)
//    const tag  = new TagToken("test-tag", 10)
//    await listing.doUntag(wallet, tag, true)
//  })
//  describe('Purchase', async()=>{ })
//  describe('Loading', async ()=>{
//    const listing = await getListing(listing_addr)
//
//    it('Should have correct fields', ()=>{
//      expect(listing.price).to.equal(price)
//      expect(listing.creator_addr).to.equal(creator_addr)
//      expect(listing.asset_id).to.equal(asset_id)
//    })
//
//  })
//})
//

// Contracts
describe('Contracts', ()=>{
  describe('Listing',  ()=>{
    it('should compile', async ()=>{
      const lh = await get_listing_compiled({
        "TMPL_CREATOR_ADDR":addrToB64("6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI"),
        "TMPL_ASSET_ID":"b64("+uintToB64(100)+")",
      })
      expect(lh.hash.length).to.equal(58)
    })
  })
})