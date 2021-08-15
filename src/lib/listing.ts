import { get_template_vars, platform_settings as ps} from './platform-conf'
import { get_listing_sig, get_platform_owner } from './contracts'
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
    get_app_call_txn
} from './transactions'
import algosdk, { Transaction } from 'algosdk';
import { Wallet } from 'algorand-session-wallet';
import { NFT } from './nft'
import { TagToken } from './tags'
import { Method } from './application'
import {LogicSig} from 'algosdk/dist/types/src/logicsig';
import { showErrorToaster } from '../Toaster';


export class Listing {
    asset_id: number
    price: number

    creator_addr: string
    contract_addr: string

    tags: TagToken[]

    nft: NFT

    source: string

    lsig: LogicSig


    constructor(price: number, asset_id: number, creator_addr: string, contract_addr?: string) {
        this.price = price
        this.asset_id = asset_id
        this.creator_addr = creator_addr
        this.contract_addr = contract_addr
        this.tags = []
    }

    getVars() {
        return get_template_vars({
            "TMPL_ASSET_ID":"b64("+uintToB64(this.asset_id)+")",
            "TMPL_CREATOR_ADDR": addrToB64(this.creator_addr)
        })
    }

    async doCreate(wallet: Wallet) {
        const lsig = await get_listing_sig(this.getVars())
        this.contract_addr = lsig.address();

        const args = [Method.Create, uintToB64(this.price), Buffer.from(lsig.lsig.logic).toString('base64')]

        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        const seed_txn = new Transaction(get_pay_txn(suggestedParams, this.creator_addr, this.contract_addr, ps.application.seed_amt))
        const asa_opt_in = new Transaction(get_asa_optin_txn(suggestedParams, this.contract_addr, this.asset_id))
        const price_opt_in = new Transaction(get_asa_optin_txn(suggestedParams, this.contract_addr, ps.application.price_id))
        const price_send = new Transaction(get_asa_xfer_txn(suggestedParams, ps.application.owner_addr, this.contract_addr, ps.application.price_id, this.price))
        const asa_send = new Transaction(get_asa_xfer_txn(suggestedParams, this.creator_addr, this.contract_addr, this.asset_id, 1))
        const asa_cfg = new Transaction(get_asa_cfg_txn(suggestedParams, this.creator_addr, this.asset_id, {
            assetManager:  this.contract_addr,
            assetReserve:  this.contract_addr,
            assetFreeze:   this.contract_addr,
            assetClawback: this.contract_addr
        }))

        const grouped = [app_call_txn, seed_txn, asa_opt_in, price_opt_in, asa_send, price_send, asa_cfg]

        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, s_seed_txn, /*asa_optin*/, /*price_optin*/,s_asa_send, /*price_send*/, s_asa_cfg] = await wallet.signTxn(grouped)

        const s_asa_opt_in = algosdk.signLogicSigTransactionObject(asa_opt_in, lsig);
        const s_price_opt_in = algosdk.signLogicSigTransactionObject(price_opt_in, lsig);

        const platform_lsig = await get_platform_owner(get_template_vars({}))
        const s_price_send = algosdk.signLogicSigTransactionObject(price_send, platform_lsig)

        const combined = [
            s_app_call_txn, s_seed_txn, s_asa_opt_in,
            s_price_opt_in, s_asa_send, s_price_send, s_asa_cfg
        ]

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
        const args = [Method.Tag]
        const fasset = [tag.id]

        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        app_call_txn.appForeignAssets = fasset

        const tag_optin_txn = new Transaction(get_asa_optin_txn(suggestedParams, this.contract_addr, tag.id))
        const tag_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, ps.application.owner_addr, this.contract_addr, tag.id, 1))

        const grouped = [app_call_txn, tag_optin_txn, tag_xfer_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, /*tag_optin*/ , /*tag_xfer*/ ] = await wallet.signTxn(grouped)


        const listing_lsig = await getLogicFromTransaction(this.contract_addr)

        const s_tag_optin_txn = algosdk.signLogicSigTransactionObject(tag_optin_txn, listing_lsig)

        const platform_lsig = await get_platform_owner(get_template_vars({}))
        const s_tag_xfer_txn = algosdk.signLogicSigTransactionObject(tag_xfer_txn, platform_lsig)

        const txngroup =  [s_app_call_txn, s_tag_optin_txn, s_tag_xfer_txn]

        this.tags.push(tag)

        if(!execute) return sendWait(txngroup)

        return await sendWait(txngroup)
    }

    async doUntag(wallet: Wallet, tag: TagToken, execute: boolean=true) {
        const args = [Method.Untag]
        const fasset = [tag.id]

        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        app_call_txn.appForeignAssets = fasset

        const tag_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner_addr, tag.id, 1))
        tag_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner_addr)

        const grouped = [app_call_txn, tag_xfer_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, /*tag_xfer*/] = await wallet.signTxn(grouped)

        const listing_lsig = await getLogicFromTransaction(this.contract_addr)
        const s_tag_xfer_txn = algosdk.signLogicSigTransactionObject(tag_xfer_txn, listing_lsig)

        const txngroup = [s_app_call_txn, s_tag_xfer_txn]

        this.tags = this.tags.filter((t)=>{ return t.id!=tag.id })

        if(!execute) return sendWait(txngroup)

        await sendWait(txngroup)
    }

    async doPriceChange(wallet: Wallet, new_price:number ) {
        const diff = this.price - new_price 

        try {
            if (diff<0) return await this.doPriceIncrease(wallet, Math.abs(diff))
            else await this.doPriceDecrease(wallet, diff)
        }catch(error){
            showErrorToaster("Couldn't update price: " + error)
            return
        }

        this.price = new_price
    }


    async doPriceIncrease(wallet: Wallet, amt: number) {

        const args = [Method.PriceIncrease, uintToB64(amt)]
        const fasset = [ps.application.price_id]
        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        app_call_txn.appForeignAssets = fasset

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, ps.application.owner_addr, this.contract_addr, ps.application.price_id, amt))

        const grouped = [app_call_txn, price_xfer_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, /* price_xfer */] = await wallet.signTxn(grouped)

        const platform_lsig = await get_platform_owner(get_template_vars({}))
        const s_price_xfer_txn = algosdk.signLogicSigTransactionObject(price_xfer_txn, platform_lsig)

        return await sendWait([s_app_call_txn, s_price_xfer_txn])
    }

    async doPriceDecrease(wallet: Wallet, amt: number) {
        const args = [Method.PriceDecrease, uintToB64(amt)]
        const fasset = [ps.application.price_id]
        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        app_call_txn.appForeignAssets = fasset

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner_addr, ps.application.price_id, amt))
        const grouped = [app_call_txn, price_xfer_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, /*price_xfer*/] = await wallet.signTxn(grouped)

        const listing_lsig = await getLogicFromTransaction(this.contract_addr)
        const s_price_xfer_txn = algosdk.signLogicSigTransactionObject(price_xfer_txn, listing_lsig)

        return await sendWait([s_app_call_txn, s_price_xfer_txn])
    }

    async doDelete(wallet: Wallet): Promise<boolean> {
        const args = [Method.Delete]
        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner_addr, ps.application.price_id, 0))
        price_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner_addr)

        const asa_cfg_txn = new Transaction(get_asa_cfg_txn(suggestedParams, this.contract_addr, this.asset_id, {
            assetManager: this.creator_addr,
            assetReserve: this.creator_addr,
            assetFreeze: this.creator_addr,
            assetClawback: this.creator_addr
        }))

        const asa_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, this.creator_addr, this.asset_id, 0))
        asa_xfer_txn.closeRemainderTo = algosdk.decodeAddress(this.creator_addr)

        const algo_close_txn = new Transaction(get_pay_txn(suggestedParams, this.contract_addr, this.creator_addr, 0))
        algo_close_txn.closeRemainderTo = algosdk.decodeAddress(this.creator_addr)

        const tagTxns = []
        for(let t in this.tags){
            const tag = this.tags[t]
            const tag_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner_addr, tag.id, 0))
            tag_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner_addr)
            tagTxns.push(tag_xfer_txn)
        }

        const grouped = [app_call_txn, price_xfer_txn,  asa_xfer_txn,  asa_cfg_txn, ...tagTxns, algo_close_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, /*price_xfer */, /*asa_xfer*/, /*asa_cfg */, /*tag_txns*/, /*algo_close */]  = await wallet.signTxn(grouped)

        const listing_lsig = await getLogicFromTransaction(this.contract_addr)
        const s_price_xfer_txn  = algosdk.signLogicSigTransaction(price_xfer_txn, listing_lsig)
        const s_asa_cfg_txn     = algosdk.signLogicSigTransaction(asa_cfg_txn, listing_lsig)
        const s_asa_xfer_txn    = algosdk.signLogicSigTransaction(asa_xfer_txn, listing_lsig)
        const s_algo_close_txn  = algosdk.signLogicSigTransaction(algo_close_txn, listing_lsig)

        const s_tagTxns = []
        for(let t in tagTxns){
            s_tagTxns.push(algosdk.signLogicSigTransactionObject(tagTxns[t], listing_lsig))
        }

        const combined = [s_app_call_txn, s_price_xfer_txn,  s_asa_xfer_txn,  s_asa_cfg_txn, ...s_tagTxns, s_algo_close_txn]

        return await sendWait(combined) !== undefined
    }

    async doPurchase(wallet: Wallet): Promise<boolean> {
        const args = [Method.Purchase]
        const suggestedParams = await getSuggested(10)

        const buyer = wallet.getDefaultAccount()

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, buyer, args))
        app_call_txn.appAccounts = [algosdk.decodeAddress(this.creator_addr), algosdk.decodeAddress(this.contract_addr)]
        app_call_txn.appForeignAssets = [ps.application.price_id]

        const purchase_amt_txn = new Transaction(get_pay_txn(suggestedParams, buyer, this.creator_addr, this.price))

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner_addr, ps.application.price_id, 0))
        price_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner_addr)

        const asa_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, buyer, this.asset_id, 0))
        asa_xfer_txn.closeRemainderTo = algosdk.decodeAddress(buyer)

        const asa_cfg_txn = new Transaction(get_asa_cfg_txn(suggestedParams, this.contract_addr, this.asset_id, {
            assetManager: buyer,
            assetReserve: buyer,
            assetFreeze: buyer,
            assetClawback: buyer,
        }))

        const algo_close_txn = new Transaction(get_pay_txn(suggestedParams, this.contract_addr, ps.application.owner_addr, ps.application.fee_amt))
        algo_close_txn.closeRemainderTo = algosdk.decodeAddress(this.creator_addr)


        const tagTxns = []
        for(let t in this.tags){
            const tag = this.tags[t]
            const tag_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner_addr, tag.id, 0))
            tag_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner_addr)
            tagTxns.push(tag_xfer_txn)
        }

        const grouped = [
            app_call_txn, purchase_amt_txn, 
            asa_xfer_txn, price_xfer_txn, 
            asa_cfg_txn, ...tagTxns, algo_close_txn
        ]

        algosdk.assignGroupID(grouped)


        const [s_app_call_txn, s_purchase_amt_txn, /*asa_xfer*/, /*price_xfer*/, /*asa_cfg*/ , /* tag_txns */, /*algo_close*/] = await wallet.signTxn(grouped)

        const listing_lsig     = await getLogicFromTransaction(this.contract_addr)
        const s_price_xfer_txn = algosdk.signLogicSigTransaction(price_xfer_txn, listing_lsig)
        const s_asa_cfg_txn    = algosdk.signLogicSigTransaction(asa_cfg_txn, listing_lsig)
        const s_asa_xfer_txn   = algosdk.signLogicSigTransaction(asa_xfer_txn, listing_lsig)
        const s_algo_close_txn = algosdk.signLogicSigTransaction(algo_close_txn, listing_lsig)

        const s_tagTxns = []
        for(let t in tagTxns){
            s_tagTxns.push(algosdk.signLogicSigTransactionObject(tagTxns[t], listing_lsig))
        }

        const combined = [
            s_app_call_txn, s_purchase_amt_txn, 
            s_asa_xfer_txn, s_price_xfer_txn, 
            s_asa_cfg_txn, ...s_tagTxns, s_algo_close_txn
        ]

        return await sendWait(combined) !== undefined
    }
}

export default Listing;