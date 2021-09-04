import { dummy_addr, dummy_id, get_approval_program, get_clear_program, get_listing_hash, get_platform_owner } from "./contracts"
import { addrToB64, sendWait, getSuggested, getTransaction, getLogicFromTransaction, download_txns } from "./algorand"
import {
    get_app_update_txn, 
    get_app_create_txn,  
    get_app_optin_txn,
    get_app_destroy_txn,
    get_asa_create_txn, 
    get_asa_destroy_txn,
    get_cosign_txn,
    get_pay_txn,
    get_app_config_txn,
} from "./transactions"
import {Wallet} from 'algorand-session-wallet'
import algosdk, { Transaction } from 'algosdk';
import { 
    platform_settings as ps ,
} from "./platform-conf";
import {makeArgs, get_template_vars, ApplicationConfiguration} from './application-configuration'
import { showErrorToaster, showInfo } from "../Toaster";
import {TagToken} from './tags'
import { PriceToken } from "./price";

declare const AlgoSigner: any;




export enum Method {
    Create = "Y3JlYXRl",
    Delete = "ZGVsZXRl",
    Tag = "dGFn",
    Untag = "dW50YWc=",
    PriceIncrease = "cHJpY2VfaW5jcmVhc2U=",
    PriceDecrease = "cHJpY2VfZGVjcmVhc2U=",
    Purchase = "cHVyY2hhc2U=",
    Safety = "c2FmZXR5",
    Config = "Y29uZmln",
}


export class Application {
    conf: ApplicationConfiguration;

    constructor(settings: ApplicationConfiguration){
        this.conf = settings
    }

    async optIn(wallet: Wallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const optin = new Transaction(get_app_optin_txn(suggested, addr, this.conf.id))
        const [signed] = await wallet.signTxn([optin])
        const result = await sendWait([signed])

        return result  
    }

    async create(wallet: Wallet): Promise<ApplicationConfiguration> {
        this.conf.admin_addr = wallet.getDefaultAccount()

        // Create blank app to reserve ID
        showInfo("Creating application to reserve ID")
        await this.updateApplication(wallet)

        // Create Owner contract account for token creation/sending 
        showInfo("Creating owner contract account")
        await this.createOwnerAcct(wallet)

        // Create price token with app name 
        showInfo("Creating price token")
        await this.createPriceToken(wallet, 0) 

        // Create listing and compute hash for app update
        await this.setListingHash()

        // Update Application with hash of contract && price token id
        showInfo("Updating listing hash")
        await this.updateApplication(wallet)

        return this.conf 
    }


    async setListingHash() {
        // Populate Contracts with ids to get the blank hash 
        const lc = await get_listing_hash(this.getVars({
            "TMPL_CREATOR_ADDR": dummy_addr, // Dummy addr
            "TMPL_ASSET_ID": dummy_id //Dummy int
        })) 

        this.conf.listing_hash = new Uint8Array(lc)
    }

    async createOwnerAcct(wallet: Wallet): Promise<string> {
        // Read in platform-owner.tmpl.teal
        // Set App id && admin addr
        const ls = await get_platform_owner(this.getVars({
            "TMPL_ADMIN_ADDR":addrToB64(this.conf.admin_addr),
        }))
        
        // Save it
        this.conf.owner_addr = ls.address()

        // Seed it
        const suggestedParams = await getSuggested(10)
        const seed_txn        = new Transaction(get_pay_txn(suggestedParams, this.conf.admin_addr, this.conf.owner_addr, this.conf.seed_amt))
        const [signed_seed]   = await wallet.signTxn([seed_txn])
        const result          = await sendWait([signed_seed])

        if(result['pool-error'] != "") console.error("Failed to seed the owner")

        return this.conf.owner_addr 
    }

    async updateApplication(wallet: Wallet) {
        const suggestedParams = await getSuggested(10)

        await this.setListingHash()

        //Set this in create or its already set

        const app = await get_approval_program(this.getVars({})) 
        const clear = await get_clear_program({})

        if (!this.conf.id){

            const create_txn = new Transaction(get_app_create_txn(suggestedParams, this.conf.admin_addr, app, clear))


            const [signed]   = await wallet.signTxn([create_txn])

            const result     = await sendWait([signed])

            this.conf.id = result['application-index']
        }else{
            const update_txn = new Transaction(get_app_update_txn(suggestedParams, this.conf.admin_addr, app, clear, this.conf.id))

            console.log(AlgoSigner.encoding.msgpackToBase64(update_txn.toByte()))

            const [s_update_txn]   = await wallet.signTxn([update_txn])

            await sendWait([s_update_txn])
            
            const params = [Method.Config, ...makeArgs(this.conf)]
            const config_txn = new Transaction(get_app_config_txn(suggestedParams, this.conf.admin_addr, this.conf.id, params))

            const [s_config_txn]   = await wallet.signTxn([config_txn])

            await sendWait([s_config_txn])
        }
    }

    async createPriceToken(wallet: Wallet, asa_id: number): Promise<boolean>  { 
        const suggestedParams = await getSuggested(10)
        const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, this.conf.admin_addr))

        const create_px = new Transaction(get_asa_create_txn(suggestedParams, this.conf.owner_addr, ps.domain))
        create_px.assetName     = PriceToken.getAssetName(this.conf.name, asa_id)
        create_px.assetUnitName = PriceToken.getUnitName(this.conf.unit)
        create_px.assetTotal    = 1e10
        create_px.assetDecimals = 0 
        
        const grouped = [cosign_txn, create_px]
        algosdk.assignGroupID(grouped)
        const [s_cosign_txn, /* create_px */] = await wallet.signTxn(grouped)

        const ls = await get_platform_owner(this.getVars({
            "TMPL_ADMIN_ADDR":addrToB64(this.conf.admin_addr),
        }))

        const s_create_px = algosdk.signLogicSigTransaction(create_px, ls)

        await sendWait([s_cosign_txn, s_create_px])

        const result = await getTransaction(s_create_px.txID)

        if(result === undefined) return false

        if(!this.conf.price_ids) this.conf.price_ids = []

        this.conf.price_ids.push(result['asset-index'])
        return true
    } 

    async destroyPriceToken(wallet: Wallet, price_id: number) : Promise<boolean> { 
        if(price_id == 0) return true

        const suggestedParams = await getSuggested(10)

        const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, this.conf.admin_addr))

        const destroy_px = new Transaction(get_asa_destroy_txn(suggestedParams, this.conf.owner_addr, price_id))
        
        const grouped = [cosign_txn, destroy_px]

        algosdk.assignGroupID(grouped)
        const [s_cosign_txn, /* s_destroy_px */] = await wallet.signTxn(grouped)

        const ls = await getLogicFromTransaction(this.conf.owner_addr)

        const s_destroy_px = algosdk.signLogicSigTransaction(destroy_px, ls)

        return (await sendWait([s_cosign_txn, s_destroy_px])) !== undefined
    } 

    async destroyApplication(wallet: Wallet): Promise<ApplicationConfiguration> {

        // Destroy tag tokens
        showInfo("Destroying tag tokens")
        const destroys = []
        for(let tidx in this.conf.tags){
            const t = this.conf.tags[tidx]
            const tag = new TagToken(this.conf, t.name, t.id)
            await tag.destroy(wallet)
        }
        this.conf.tags = []


        // Destroy price token
        showInfo("Destroying price token")
        for(const pidx in this.conf.price_ids){
            if(!await this.destroyPriceToken(wallet, this.conf.price_ids[pidx])){
                showErrorToaster("Couldn't delete price token")
                return this.conf
            }

        }

        // Return algos to admin
        if(this.conf.owner_addr !== ""){
            showInfo("Returning algos to admin")
            const suggestedParams = await getSuggested(10)

            const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, this.conf.admin_addr))
            const pay_txn = new Transaction(get_pay_txn(suggestedParams, this.conf.owner_addr, this.conf.admin_addr, 0))
            pay_txn.closeRemainderTo = algosdk.decodeAddress(this.conf.admin_addr)

            const grouped = [cosign_txn, pay_txn]
            algosdk.assignGroupID(grouped)

            const [s_cosign_txn, /* s_pay_txn */] = await wallet.signTxn(grouped)

            const ls = await getLogicFromTransaction(this.conf.owner_addr)
            const s_pay_txn = algosdk.signLogicSigTransaction(pay_txn, ls)

            if((await sendWait([s_cosign_txn, s_pay_txn])) === undefined){
                showErrorToaster("Couldn't return algos to admin")
                return this.conf 
            }
        }

        // Destroy application
        showInfo("Destroying application")
        const suggestedParams = await getSuggested(10)
        const destroy_app_txn = new Transaction(get_app_destroy_txn(suggestedParams, this.conf.admin_addr, this.conf.id))
        const [s_destroy_app_txn] = await wallet.signTxn([destroy_app_txn])
        if((await sendWait([s_destroy_app_txn])) == undefined){
            showErrorToaster("Couldn't destroy application")
            return this.conf
        }

        this.conf.listing_hash = new Uint8Array()
        this.conf.id = 0
        return this.conf
    }


    getVars(overwrite: any): any {
        return get_template_vars(this.conf, overwrite)
    }
}