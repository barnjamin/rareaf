import { ApplicationConfiguration, get_template_vars } from './application-configuration'
import { get_listing_sig } from './contracts'
import {
    uintToB64, 
    addrToB64, 
    getSuggested, 
    sendWait,
    getLogicFromTransaction
} from './algorand'
import {
    get_asa_cfg_txn, 
    get_asa_xfer_txn, 
    get_asa_optin_txn, 
    get_pay_txn, 
    get_app_call_txn,
    get_app_optin_txn
} from './transactions'
import algosdk, { OnApplicationComplete, Transaction } from 'algosdk';
import { Wallet } from 'algorand-session-wallet';
import { NFT } from './nft'
import { TagToken } from './tags'
import { Method } from './application'
import {LogicSig} from 'algosdk/dist/types/src/logicsig';
import { showErrorToaster } from '../Toaster';
import { PriceToken } from './price';


export class Listing {
    asset_id: number

    price: number
    price_token: PriceToken

    creator_addr: string
    contract_addr: string

    tags: TagToken[]

    nft: NFT

    source: string

    lsig: LogicSig

    ac: ApplicationConfiguration

    constructor(price: number, price_token: PriceToken, asset_id: number, creator_addr: string, ac: ApplicationConfiguration, contract_addr?: string) {
        this.price = price
        this.price_token = price_token 
        this.asset_id = asset_id
        this.creator_addr = creator_addr
        this.contract_addr = contract_addr
        this.ac = ac
        this.tags = []
    }

    getVars() {
        return get_template_vars(this.ac, {
            "TMPL_NONCE": "0x"+Buffer.from((Math.random() + 1).toString(36).substring(7)).toString("hex"),
        })
    }

    async doCreate(wallet: Wallet) {
        const lsig = await get_listing_sig(this.getVars())
        this.contract_addr = lsig.address();

        /*
            Seed creator => listing addr 
            listing opt into app
            listing opt into nft
            xfer nft creator=>listing
            rekey listing to app addr 
        */

        const suggestedParams = await getSuggested(10)

        const seed_txn = new Transaction(get_pay_txn(suggestedParams, this.creator_addr, this.contract_addr, 1e8))
        const listing_app_optin = new Transaction(get_app_optin_txn(suggestedParams, this.contract_addr, this.ac.id))
        const listing_nft_optin = new Transaction(get_asa_optin_txn(suggestedParams, this.contract_addr, this.asset_id)) 
        const nft_xfer = new Transaction(get_asa_xfer_txn(suggestedParams, this.creator_addr, this.contract_addr, this.asset_id, 1))
        const listing_rekey = new Transaction(get_pay_txn(suggestedParams, this.contract_addr, this.contract_addr, 0))
        listing_rekey.reKeyTo = algosdk.decodeAddress(this.ac.app_addr)

        const grouped = [seed_txn, listing_app_optin, listing_nft_optin, nft_xfer, listing_rekey]

        algosdk.assignGroupID(grouped)

        const [s_seed_txn, /*listing_app_optin*/, /*listing_nft_optin*/, s_nft_xfer, /*listing_rekey*/] = await wallet.signTxn(grouped)

        const s_app_opt_in = algosdk.signLogicSigTransactionObject(listing_app_optin, lsig);
        const s_nft_opt_in = algosdk.signLogicSigTransactionObject(listing_nft_optin, lsig);
        const s_rekey = algosdk.signLogicSigTransactionObject(listing_rekey, lsig);

        const combined = [ s_seed_txn, s_app_opt_in, s_nft_opt_in, s_nft_xfer, s_rekey ]

        return await sendWait(combined)
    }

    async doTags(wallet: Wallet, tags: TagToken[]){
        const txns = []
        for (let x=0; x<tags.length; x++){
            txns.push(await this.doTag(wallet, tags[x], false))
        }
        return await Promise.all(txns)
    }

    async doUntags(wallet: Wallet, tags: TagToken[]){
        const txns = []
        for (let x=0; x<tags.length; x++){
            txns.push(await this.doUntag(wallet, tags[x], false))
        }
        return await Promise.all(txns)
    }

    async doTag(wallet: Wallet, tag: TagToken, execute: boolean=true) {
        const suggestedParams = await getSuggested(100)
        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.ac.id, this.creator_addr, [Method.Tag]))
        app_call_txn.appForeignAssets =  [tag.id]
        app_call_txn.appAccounts = [algosdk.decodeAddress(this.contract_addr)]

        const [s_app_call_txn] = await wallet.signTxn([app_call_txn])

        this.tags.push(tag)

        if(!execute) return sendWait([s_app_call_txn])
        return await sendWait([s_app_call_txn])
    }

    async doUntag(wallet: Wallet, tag: TagToken, execute: boolean=true) {
        const suggestedParams = await getSuggested(10)
        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.ac.id, this.creator_addr, [Method.Untag]))
        app_call_txn.appForeignAssets =  [tag.id]
        app_call_txn.appAccounts = [algosdk.decodeAddress(this.contract_addr)]

        const [s_app_call_txn] = await wallet.signTxn([app_call_txn])

        this.tags = this.tags.filter((t)=>{ return t.id!=tag.id })

        if(!execute) return sendWait([s_app_call_txn])
        await sendWait([s_app_call_txn])
    }

    async doPriceChange(wallet: Wallet, new_price:number) {
        const suggestedParams = await getSuggested(100)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.ac.id, this.creator_addr, [Method.Reprice, uintToB64(new_price)]))
        app_call_txn.appForeignAssets = [this.price_token.id]
        app_call_txn.appAccounts = [algosdk.decodeAddress(this.contract_addr)]

        const [s_app_call_txn] = await wallet.signTxn([app_call_txn])

        return await sendWait([s_app_call_txn])
    }

    async doDelete(wallet: Wallet): Promise<boolean> {

        /*
            app call to delete from creator
            app call to close out from lsig
            close algos to creator
        */


        const suggestedParams = await getSuggested(100)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.ac.id, this.creator_addr, [Method.Delete]))
        app_call_txn.appForeignAssets = [this.asset_id, this.price_token.id]
        app_call_txn.appAccounts = [algosdk.decodeAddress(this.contract_addr)]

        const app_close_txn = new Transaction(get_app_call_txn(suggestedParams, this.ac.id, this.contract_addr, []))
        app_close_txn.appOnComplete = OnApplicationComplete.CloseOutOC

        const algo_close_txn = new Transaction(get_pay_txn(suggestedParams, this.contract_addr, this.creator_addr, 0))
        algo_close_txn.closeRemainderTo = algosdk.decodeAddress(this.creator_addr)

        const grouped = [app_call_txn, app_close_txn, algo_close_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, /*app_close*/, /*algo_close */]  = await wallet.signTxn(grouped)

        const listing_lsig = await getLogicFromTransaction(this.contract_addr)

        const s_app_close_txn   = algosdk.signLogicSigTransaction(app_close_txn, listing_lsig)
        const s_algo_close_txn  = algosdk.signLogicSigTransaction(algo_close_txn, listing_lsig)

        const combined = [s_app_call_txn, s_app_close_txn, s_algo_close_txn]

        return await sendWait(combined) !== undefined
    }

    async doPurchase(wallet: Wallet): Promise<boolean> {
        return false
        //const args = [Method.Purchase]
        //const suggestedParams = await getSuggested(10)

        //const buyer = wallet.getDefaultAccount()

        //const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.ac.id, buyer, args))
        //app_call_txn.appAccounts = [algosdk.decodeAddress(this.creator_addr), algosdk.decodeAddress(this.contract_addr)]
        //app_call_txn.appForeignAssets = [this.price_token.id]

        //const purchase_amt_txn = new Transaction(get_pay_txn(suggestedParams, buyer, this.creator_addr, this.price))

        //const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, this.ac.owner_addr, this.price_token.id, 0))
        //price_xfer_txn.closeRemainderTo = algosdk.decodeAddress(this.ac.owner_addr)

        //const asa_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, buyer, this.asset_id, 0))
        //asa_xfer_txn.closeRemainderTo = algosdk.decodeAddress(buyer)

        //const asa_cfg_txn = new Transaction(get_asa_cfg_txn(suggestedParams, this.contract_addr, this.asset_id, {
        //    assetManager: buyer,
        //    assetReserve: buyer,
        //    assetFreeze: buyer,
        //    assetClawback: buyer,
        //}))

        //const algo_close_txn = new Transaction(get_pay_txn(suggestedParams, this.contract_addr, this.ac.owner_addr, this.ac.fee_amt))
        //algo_close_txn.closeRemainderTo = algosdk.decodeAddress(this.creator_addr)


        //const tagTxns = []
        //for(let t in this.tags){
        //    const tag = this.tags[t]
        //    const tag_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, this.ac.owner_addr, tag.id, 0))
        //    tag_xfer_txn.closeRemainderTo = algosdk.decodeAddress(this.ac.owner_addr)
        //    tagTxns.push(tag_xfer_txn)
        //}

        //const grouped = [
        //    app_call_txn, purchase_amt_txn, 
        //    asa_xfer_txn, price_xfer_txn, 
        //    asa_cfg_txn, ...tagTxns, algo_close_txn
        //]

        //algosdk.assignGroupID(grouped)


        //const [s_app_call_txn, s_purchase_amt_txn, /*asa_xfer*/, /*price_xfer*/, /*asa_cfg*/ , /* tag_txns */, /*algo_close*/] = await wallet.signTxn(grouped)

        //const listing_lsig     = await getLogicFromTransaction(this.contract_addr)
        //const s_price_xfer_txn = algosdk.signLogicSigTransaction(price_xfer_txn, listing_lsig)
        //const s_asa_cfg_txn    = algosdk.signLogicSigTransaction(asa_cfg_txn, listing_lsig)
        //const s_asa_xfer_txn   = algosdk.signLogicSigTransaction(asa_xfer_txn, listing_lsig)
        //const s_algo_close_txn = algosdk.signLogicSigTransaction(algo_close_txn, listing_lsig)

        //const s_tagTxns = []
        //for(let t in tagTxns){
        //    s_tagTxns.push(algosdk.signLogicSigTransactionObject(tagTxns[t], listing_lsig))
        //}

        //const combined = [
        //    s_app_call_txn, s_purchase_amt_txn, 
        //    s_asa_xfer_txn, s_price_xfer_txn, 
        //    s_asa_cfg_txn, ...s_tagTxns, s_algo_close_txn
        //]

        //return await sendWait(combined) !== undefined
    }
}

export default Listing;