import  {platform_settings as ps} from './platform-conf'
import { get_listing_compiled, get_listing_sig, get_platform_sig } from './contracts'
import {
    getSuggested, sendWaitGroup,
    get_asa_cfg_txn, get_asa_xfer_txn, get_asa_optin_txn, get_pay_txn, get_app_call_txn, uintToB64String
} from './algorand'
import algosdk, { assignGroupID, Transaction } from 'algosdk';
import { Wallet } from '../wallets/wallet';
import { NFT } from './nft'
import {TagToken} from './tags'
import { Method } from './application'
import LogicSig from 'algosdk/dist/types/src/logicsig';


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
    }

    getEncodedVars() {
        // Encode vars for inclusion in contract
        const var_id = uintToB64String(this.asset_id)
        const var_addr = Buffer.from(algosdk.decodeAddress(this.creator_addr).publicKey).toString('base64')

        return [var_id, var_addr]
    }

    getVars() {
        const [var_id, var_addr] = this.getEncodedVars()

        return {
            TMPL_PRICE_ID: ps.application.price_token,
            TMPL_APP_ID: ps.application.id,
            TMPL_PLATFORM_FEE: ps.application.fee,
            TMPL_PLATFORM_ADDR: ps.application.owner,


            TMPL_ASSET_ID: `base64(${var_id})`,
            TMPL_CREATOR_ADDR: `base64(${var_addr})`
        }
    }

    async doCreate(wallet: Wallet) {

        this.creator_addr = wallet.getDefaultAccount()

        const compiled = await get_listing_compiled(this.getVars())
        this.contract_addr = compiled.hash;

        const args = [Method.Create, uintToB64String(this.price), compiled.result]

        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        const seed_txn = new Transaction(get_pay_txn(suggestedParams, this.creator_addr, this.contract_addr, ps.application.seed))
        const asa_opt_in = new Transaction(get_asa_optin_txn(suggestedParams, this.contract_addr, this.asset_id))
        const price_opt_in = new Transaction(get_asa_optin_txn(suggestedParams, this.contract_addr, ps.application.price_token))
        const price_send = new Transaction(get_asa_xfer_txn(suggestedParams, ps.application.owner, this.contract_addr, ps.application.price_token, this.price))
        const asa_send = new Transaction(get_asa_xfer_txn(suggestedParams, this.creator_addr, this.contract_addr, this.asset_id, 1))
        const asa_cfg = new Transaction(get_asa_cfg_txn(suggestedParams, this.creator_addr, this.asset_id, {
            assetManager: this.contract_addr,
            assetReserve: this.contract_addr,
            assetFreeze: this.contract_addr,
            assetClawback: this.contract_addr
        }))

        const grouped = [app_call_txn, seed_txn, asa_opt_in, price_opt_in, asa_send, price_send, asa_cfg]

        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, s_seed_txn, s_asa_send, s_asa_cfg] = await wallet.signTxn(grouped)

        console.log("here")
        const listing_lsig = await get_listing_sig(this.getVars())
        const s_asa_opt_in = algosdk.signLogicSigTransactionObject(asa_opt_in, listing_lsig);
        const s_price_opt_in = algosdk.signLogicSigTransactionObject(price_opt_in, listing_lsig);
        console.log("here too")

        const platform_lsig = await get_platform_sig()
        console.log(platform_lsig)
        const s_price_send = algosdk.signLogicSigTransactionObject(price_send, platform_lsig)

        console.log("here three")
        const combined = [
            s_app_call_txn, s_seed_txn, s_asa_opt_in,
            s_price_opt_in, s_asa_send, s_price_send, s_asa_cfg
        ]
        console.log(combined)

        return await sendWaitGroup(combined)
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
        const tag_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, ps.application.owner, this.contract_addr, tag.id, 1))

        const grouped = [app_call_txn, tag_optin_txn, tag_xfer_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn] = await wallet.signTxn(grouped)

        const listing_lsig = await get_listing_sig(this.getVars())
        const s_tag_optin_txn = algosdk.signLogicSigTransactionObject(tag_optin_txn, listing_lsig)

        const platform_lsig = await get_platform_sig()
        const s_tag_xfer_txn = algosdk.signLogicSigTransactionObject(tag_xfer_txn, platform_lsig)

        const txngroup =  [s_app_call_txn, s_tag_optin_txn, s_tag_xfer_txn]
        if(!execute){
            return txngroup
        }

        return await sendWaitGroup(txngroup)
    }

    async doUntag(wallet: Wallet, tag: TagToken, execute: boolean=true) {
        const args = [Method.Untag]
        const fasset = [tag.id]

        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        app_call_txn.appForeignAssets = fasset

        const tag_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner, tag.id, 1))
        tag_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner)

        const grouped = [app_call_txn, tag_xfer_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn] = await wallet.signTxn(grouped)

        const listing_lsig = await get_listing_sig(this.getVars())
        const s_tag_xfer_txn = algosdk.signLogicSigTransactionObject(tag_xfer_txn, listing_lsig)

        const txngroup = [s_app_call_txn, s_tag_xfer_txn]
        if(!execute){
            return txngroup
        }

        return await sendWaitGroup(txngroup)
    }

    async doPriceChange(wallet: Wallet, new_price:number ) {
        const diff = this.price - new_price 

        if (diff<0) return await this.doPriceIncrease(wallet, Math.abs(diff))

        return await this.doPriceDecrease(wallet, diff)
    }


    async doPriceIncrease(wallet: Wallet, amt: number) {

        const args = [Method.PriceIncrease, uintToB64String(amt)]
        const fasset = [ps.application.price_token]
        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        app_call_txn.appForeignAssets = fasset

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, ps.application.owner, this.contract_addr, ps.application.price_token, amt))

        algosdk.assignGroupID([app_call_txn, price_xfer_txn])

        const [s_app_call_txn] = await wallet.signTxn([app_call_txn])

        const platform_lsig = await get_platform_sig()
        const s_price_xfer_txn = algosdk.signLogicSigTransactionObject(price_xfer_txn, platform_lsig)

        return await sendWaitGroup([s_app_call_txn, s_price_xfer_txn])
    }

    async doPriceDecrease(wallet: Wallet, amt: number) {
        const args = [Method.PriceDecrease, uintToB64String(amt)]
        const fasset = [ps.application.price_token]
        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))
        app_call_txn.appForeignAssets = fasset

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner, ps.application.price_token, amt))

        algosdk.assignGroupID([app_call_txn, price_xfer_txn])

        const [s_app_call_txn] = await wallet.signTxn([app_call_txn])

        const listing_lsig = await get_listing_sig(this.getVars())
        const s_price_xfer_txn = algosdk.signLogicSigTransactionObject(price_xfer_txn, listing_lsig)

        return await sendWaitGroup([s_app_call_txn, s_price_xfer_txn])
    }

    async doDelete(wallet: Wallet) {
        const args = [Method.Delete]
        const suggestedParams = await getSuggested(10)

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, this.creator_addr, args))

        const rawTx = algosdk.decodeUnsignedTransaction(app_call_txn.toByte());
        const processedTx = rawTx._getDictForDisplay();

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner, ps.application.price_token, 0))
        price_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner)

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

        const grouped = [app_call_txn, price_xfer_txn,  asa_xfer_txn,  asa_cfg_txn, algo_close_txn]
        algosdk.assignGroupID(grouped)

        const [s_app_call_txn]  = await wallet.signTxn(grouped)

        const listing_lsig      = await get_listing_sig(this.getVars())
        const s_price_xfer_txn  = algosdk.signLogicSigTransaction(price_xfer_txn, listing_lsig)
        const s_asa_cfg_txn     = algosdk.signLogicSigTransaction(asa_cfg_txn, listing_lsig)
        const s_asa_xfer_txn    = algosdk.signLogicSigTransaction(asa_xfer_txn, listing_lsig)
        const s_algo_close_txn  = algosdk.signLogicSigTransaction(algo_close_txn, listing_lsig)

        const combined = [s_app_call_txn, s_price_xfer_txn,  s_asa_xfer_txn,  s_asa_cfg_txn, s_algo_close_txn]
        return await sendWaitGroup(combined)
    }

    async doPurchase(wallet: Wallet) {
        const args = [Method.Purchase]
        const suggestedParams = await getSuggested(10)

        const buyer = wallet.getDefaultAccount()

        const app_call_txn = new Transaction(get_app_call_txn(suggestedParams, buyer, args))
        app_call_txn.appAccounts = [algosdk.decodeAddress(this.creator_addr)]

        const purchase_amt_txn = new Transaction(get_pay_txn(suggestedParams, buyer, this.creator_addr, this.price))

        const price_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, ps.application.owner, ps.application.price_token, 0))
        price_xfer_txn.closeRemainderTo = algosdk.decodeAddress(ps.application.owner)
        price_xfer_txn.amount = 1

        const asa_xfer_txn = new Transaction(get_asa_xfer_txn(suggestedParams, this.contract_addr, buyer, this.asset_id, 0))
        asa_xfer_txn.closeRemainderTo = algosdk.decodeAddress(buyer)
        asa_xfer_txn.amount =  1

        const asa_cfg_txn = new Transaction(get_asa_cfg_txn(suggestedParams, this.creator_addr, this.asset_id, {
            assetManager: buyer,
            assetReserve: buyer,
            assetFreeze: buyer,
            assetClawback: buyer,
        }))

        const algo_close_txn = new Transaction(get_pay_txn(suggestedParams, this.contract_addr, ps.application.owner, ps.application.fee))
        algo_close_txn.closeRemainderTo = algosdk.decodeAddress(this.creator_addr)

        const grouped = [
            app_call_txn, purchase_amt_txn, 
            asa_xfer_txn, price_xfer_txn, 
            asa_cfg_txn, algo_close_txn
        ]

        algosdk.assignGroupID(grouped)

        const [s_app_call_txn, s_purchase_amt_txn] = await wallet.signTxn(grouped)

        const listing_lsig = await get_listing_sig(this.getVars())
        const s_price_xfer_txn = algosdk.signLogicSigTransaction(price_xfer_txn, listing_lsig)
        const s_asa_cfg_txn = algosdk.signLogicSigTransaction(asa_cfg_txn, listing_lsig)
        const s_asa_xfer_txn = algosdk.signLogicSigTransaction(asa_xfer_txn, listing_lsig)
        const s_algo_close_txn = algosdk.signLogicSigTransaction(algo_close_txn, listing_lsig)

        const combined = [
            s_app_call_txn, s_purchase_amt_txn, 
            s_asa_xfer_txn, s_price_xfer_txn, 
            s_asa_cfg_txn, s_algo_close_txn
        ]

        return await sendWaitGroup(combined)
    }
}

export default Listing;