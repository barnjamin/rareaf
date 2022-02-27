import { dummy_addr, dummy_id, get_approval_program, get_clear_program, get_listing_hash } from "./contracts"
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
import algosdk, { getApplicationAddress, Transaction } from 'algosdk';
import { 
    platform_settings as ps ,
} from "./platform-conf";
import {makeArgs, get_template_vars, ApplicationConfiguration} from './application-configuration'
import { showErrorToaster, showInfo } from "../Toaster";
import {TagToken} from './tags'
import { PriceToken } from "./price";

declare const AlgoSigner: any;


export enum AdminMethod {
    CreatePrice = "Y3JlYXRlX3ByaWNlCg==",   // Create ASA to represent specific pricing token
    DestroyPrice = "ZGVzdHJveV9wcmljZQo=",  // Destroy price token
    CreateTag = "Y3JlYXRlX3RhZwo=",         // Create tag token
    DestroyTag = "ZGVzdHJveV90YWcK",        // Destroy tag token
    Safety = "c2FmZXR5",                    // Destroy listing, in case it violates TOS
    Config = "Y29uZmln",                    // Change the config of the application
}

export enum Method {
    Create = "Y3JlYXRl",        // Create listing
    Delete = "ZGVsZXRl",        // Delete listing
    Tag = "dGFn",               // Add tag to listing
    Untag = "dW50YWc=",         // Remove tag from listing
    Reprice = "cmVwcmljZQo=",   // Change price of listing
    Purchase = "cHVyY2hhc2U=",  // Buy listing
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

    async updateApplication(wallet: Wallet) {
        const suggestedParams = await getSuggested(100)

        const app = await get_approval_program({}) 
        const clear = await get_clear_program({})

        if (!this.conf.id){
            const create_txn = new Transaction(get_app_create_txn(suggestedParams, this.conf.admin_addr, app, clear))

            const [signed]   = await wallet.signTxn([create_txn])
            const result     = await sendWait([signed])

            this.conf.id = result['application-index']
            this.conf.app_addr = getApplicationAddress(this.conf.id) 

            const fund_txn = new Transaction(get_pay_txn(suggestedParams, this.conf.admin_addr, this.conf.app_addr, 1e8))
            const [s_fund_txn] = await wallet.signTxn([fund_txn])
            await sendWait([s_fund_txn])

        }else{
            const update_txn = new Transaction(get_app_update_txn(suggestedParams, this.conf.admin_addr, app, clear, this.conf.id))
            const [s_update_txn]   = await wallet.signTxn([update_txn])
            await sendWait([s_update_txn])
        }
    }

    async updateConfiguration(wallet: Wallet) {
        const suggestedParams = await getSuggested(100)
        const params = [AdminMethod.Config, ...makeArgs(this.conf)]
        const config_txn = new Transaction(get_app_config_txn(suggestedParams, this.conf.admin_addr, this.conf.id, params))
        const [s_config_txn]   = await wallet.signTxn([config_txn])
        await sendWait([s_config_txn])
    }

    async createPriceToken(wallet: Wallet, asa_id: number): Promise<boolean>  { 
        const pt = new PriceToken(this.conf, PriceToken.getAssetName(this.conf.name, asa_id))
        return await pt.create(this.conf, wallet)
    } 

    async destroyPriceToken(wallet: Wallet, price: PriceToken) : Promise<boolean> { 
        return await price.destroy(this.conf, wallet)
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
        if(this.conf.app_addr !== ""){
            showInfo("Returning algos to admin")
            const suggestedParams = await getSuggested(10)

            const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, this.conf.admin_addr))
            const pay_txn = new Transaction(get_pay_txn(suggestedParams, this.conf.app_addr, this.conf.admin_addr, 0))
            pay_txn.closeRemainderTo = algosdk.decodeAddress(this.conf.admin_addr)

            const grouped = [cosign_txn, pay_txn]
            algosdk.assignGroupID(grouped)

            const [s_cosign_txn, /* s_pay_txn */] = await wallet.signTxn(grouped)

            const ls = await getLogicFromTransaction(this.conf.app_addr)
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