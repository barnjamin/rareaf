import register from 'ignore-styles'
register(['.scss', '.teal'])

import { expect } from 'chai';
import { platform_settings as ps } from '../src/lib/platform-conf';
import 'mocha';

import {uintToB64, addrToB64, getListing} from '../src/lib/algorand'
import Listing from '../src/lib/listing';
import {Application} from '../src/lib/application';
import {TagToken} from '../src/lib/tags';

import InsecureWallet from '../src/wallets/insecurewallet';
import { storeNFT } from '../src/lib/ipfs';
import { emptyMetadata, NFTMetadata } from '../src/lib/nft';
import { get_listing_hash, get_listing_compiled } from '../src/lib/contracts';

const admin_addr = ""
const listing_addr =  "3ESDM4QRMD4DJ43NURUBLWRSUBY4RYL6WPEPU77QFJSYX6KKCBVZFR6ZCM"
const creator_addr = ""
const asset_id = 0
const price = 10000

const wallet = new InsecureWallet()


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


// NFT
//describe('NFT', ()=>{
//  describe('Upload', ()=>{ 
//    
//    //const file = new File("")
//    //const meta = emptyMetadata()
//    //meta.name = "Test"
//    //meta.description = "Test Metadata"
//    //meta.image = ""
//    //meta.properties = {
//    //  file:{
//    //      name: "",
//    //      type: "",
//    //      size: 0,
//    //  },
//    //  artist: "",
//    //}
//    //storeNFT(file, meta)
//  })
//
//  describe('Create', ()=>{ })
//  describe ('Destroy', ()=>{ })
//})


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