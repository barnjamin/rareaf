import { 
    addrToB64, 
    sendWait, 
    getSuggested, 
    get_app_update_txn, 
    get_app_create_txn,  
    get_app_optin_txn,
    get_asa_create_txn, 
    get_cosign_txn,
    get_pay_txn,
    waitForConfirmation,
    getTransaction
} from "./algorand"
import { dummy_addr, dummy_id, get_approval_program, get_clear_program, get_listing_hash, get_platform_owner } from "./contracts"
import {Wallet} from '../wallets/wallet'
import algosdk, { Transaction } from 'algosdk';
import { 
    AppConf,
    platform_settings as ps ,
    get_template_vars
} from "./platform-conf";



export enum Method {
    Create = "Y3JlYXRl",
    Delete = "ZGVsZXRl",
    Tag = "dGFn",
    Untag = "dW50YWc=",
    PriceIncrease = "cHJpY2VfaW5jcmVhc2U=",
    PriceDecrease = "cHJpY2VfZGVjcmVhc2U=",
    Purchase = "cHVyY2hhc2U=",
}


export class Application {
    conf: AppConf;

    constructor(settings: AppConf){
        this.conf = settings
    }

    async optIn(wallet: Wallet): Promise<boolean> {
        const suggested = await getSuggested(10)
        const addr = wallet.getDefaultAccount()

        const optin = new Transaction(get_app_optin_txn(suggested, addr, this.conf.app_id))
        const [signed] = await wallet.signTxn([optin])
        const result = await sendWait([signed])

        return result  
    }

    async create(wallet: Wallet): Promise<AppConf> {
        this.conf.admin_addr = wallet.getDefaultAccount()

        // Create blank app to reserve ID
        await this.updateApplication(wallet)

        ps.application = this.conf
        console.log(this.conf)
        // Create Owner contract account for token creation/sending 
        await this.createOwnerAcct(wallet)
        console.log(this.conf)

        ps.application = this.conf
        // Create price token with app name 
        await this.createPriceToken(wallet) 

        ps.application = this.conf
        console.log(this.conf)
        // Create listing and compute hash for app update
        await this.setListingHash()

        ps.application = this.conf
        console.log(this.conf)

        // Update Application with hash of contract && price token id
        await this.updateApplication(wallet)
        ps.application = this.conf

        console.log(this.conf)
        return this.conf 
    }


    async setListingHash() {
        // Populate Contracts with ids to get the blank hash 
        const lc = await get_listing_hash(this.getVars({
            "TMPL_CREATOR_ADDR": dummy_addr, // Dummy addr
            "TMPL_ASSET_ID": dummy_id //Dummy int
        })) 

        this.conf.listing_hash = "b64("+lc.toString('base64')+")"
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

        return ls.address() 
    }

    async updateApplication(wallet: Wallet) {
        const suggestedParams = await getSuggested(10)

        await this.setListingHash()

        const app = await get_approval_program(this.getVars({})) 
        const clear = await get_clear_program({})

        if (!this.conf.app_id){
            const create_txn = new Transaction(get_app_create_txn(suggestedParams, this.conf.admin_addr, app, clear))
            const [signed]   = await wallet.signTxn([create_txn])
            const result     = await sendWait([signed])

            this.conf.app_id = result['application-index']
        }else{
            const update_txn = new Transaction(get_app_update_txn(suggestedParams, this.conf.admin_addr, app, clear, this.conf.app_id))
            const [signed]   = await wallet.signTxn([update_txn])
            await sendWait([signed])
        }
    }

    async createPriceToken(wallet: Wallet)  { 
        const suggestedParams = await getSuggested(10)
        const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, this.conf.admin_addr))

        const create_px = new Transaction(get_asa_create_txn(suggestedParams, this.conf.owner_addr, ps.domain))
        create_px.assetName     = this.conf.name
        create_px.assetUnitName = this.conf.unit + "-px"
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
        console.log(result)
        this.conf.price_id = result['asset-index']
    } 

    getVars(overwrite: any): any {
        return get_template_vars(overwrite)
    }
}