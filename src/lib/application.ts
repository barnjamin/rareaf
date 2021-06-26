import { get_app_update_txn, download_txns, getSuggested, get_app_create_txn, sendWait, sendWaitGroup, get_asa_create_txn } from "./algorand"
import { get_approval_program, get_clear_program, get_listing_hash } from "./contracts"
import {Wallet} from '../wallets/wallet'
import algosdk, { assignGroupID, Transaction } from 'algosdk';


const dummy_addr = "b64(YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=)"
const dummy_id = "b64(AAAAAAAAAHs=)"

export enum Method {
    Create = "Y3JlYXRl",
    Delete = "ZGVsZXRl",
    Tag = "dGFn",
    Untag = "dW50YWc=",
    PriceIncrease = "cHJpY2VfaW5jcmVhc2U=",
    PriceDecrease = "cHJpY2VfZGVjcmVhc2U=",
    Purchase = "cHVyY2hhc2U=",
}
export type AppConf = {
    owner: string // Address of applictation owner
    name: string  // Full name of 
    unit: string  // Unit name for price/tag tokens
    fee:  number   // Amount to be sent to app onwer on sales

    id?: number          // ID of application 
    price_token?: number  // ID of token representing price 
    listing_hash?: string // Sha256 of blanked out listing contract  
}

export class Application {
    conf: AppConf;

    constructor(settings: any){
        this.conf = settings
    }

    async create(wallet: Wallet): Promise<AppConf> {
        this.conf.owner = wallet.getDefaultAccount()
        console.log(this.conf)
        
        // Create blank app to reserve ID
        await this.updateApplication(wallet)

        // Create price token with app name 
        await this.createPriceToken(wallet) 

        // Populate Contracts with ids to get the blank hash 
        const lc = await get_listing_hash({
            "TMPL_PRICE_ID": this.conf.price_token, 
            "TMPL_APP_ID":this.conf.id,
            "TMPL_CREATOR_ADDR": dummy_addr, // Dummy addr
            "TMPL_ASSET_ID": dummy_id //Dummy int
        }) 
        this.conf.listing_hash = lc.toString('base64')

        // Update Application with hash of contract && price token id
        await this.updateApplication(wallet)

        // Sign delegate to xfer tokens
        // this.signDelegate()

        return this.conf 
    }


    async signDelegate(): Promise<Buffer> {
        return undefined
    }

    async updateApplication(wallet: Wallet) {
        const suggestedParams = await getSuggested(10)

        const app = await get_approval_program({
            "TMPL_PRICE_ID":this.conf.price_token, 
            "TMPL_BLANK_HASH": this.conf.listing_hash ||= dummy_addr
        }) 

        const clear = await get_clear_program({})

        if (!this.conf.id){
            const create_txn = new Transaction(get_app_create_txn(suggestedParams, this.conf.owner, app, clear))
            const signed = await wallet.signTxn([create_txn])
            const result = await sendWaitGroup(signed)
            if(result['pool-error'] != "") {
                console.error("Failed to create the application")
            }
            this.conf.id = result['application-index']
        }else{
            const create_txn = new Transaction(get_app_update_txn(suggestedParams, this.conf.owner, app, clear, this.conf.id))
            const signed = await wallet.signTxn([create_txn])
            const result = await sendWaitGroup(signed)
            if(result['pool-error'] != "") {
                console.error("Failed to create the application")
            }
        }
    }

    async createPriceToken(wallet: Wallet)  { 
        const suggestedParams = await getSuggested(10)
        const create_px = new Transaction(get_asa_create_txn(suggestedParams, this.conf.owner, {}))
        create_px.assetName = this.conf.name
        create_px.assetUnitName = this.conf.unit + "-px"
        create_px.assetTotal = 1e10
        create_px.assetDecimals = 1 //TODO: remove
        const signed = await wallet.signTxn([create_px])
        const result = await sendWaitGroup(signed)
        if(result['pool-error'] != "") {
            console.error("Failed to create the application")
        }

        this.conf.price_token = result['asset-index']
    } 

    async createTagToken(name: string) { }
}