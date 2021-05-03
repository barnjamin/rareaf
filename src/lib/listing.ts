import {platform_settings as ps} from './platform-conf'
import { get_listing_compiled, get_signed_platform_bytes } from './contracts'
import { 
    getAlgodClient, sendWait, waitForConfirmation,
    get_asa_cfg, get_pay_txn, get_optin_txn, get_asa_txn
} from './algorand'
import algosdk from 'algosdk';
import { Wallet } from '../wallets/wallet';


class listing {
    asset_id: number
    price: number

    creator_addr: string
    contract_addr: string


    constructor(price: number, asset_id: number, creator_addr: string, contract_addr?: string) {
        this.price          = price
        this.asset_id       = asset_id
        this.creator_addr   = creator_addr
        this.contract_addr  = contract_addr
    }



    getEncodedVars(){
        // Encode vars for inclusion in contract
        const var_price = Buffer.from(algosdk.encodeUint64(this.price)).toString('base64')
        const var_id    = Buffer.from(algosdk.encodeUint64(this.asset_id)).toString('base64')
        const var_addr  = Buffer.from(algosdk.decodeAddress(this.creator_addr).publicKey).toString('base64')

        return [var_price, var_id, var_addr]
    }

    getVars(){

        const var_price, var_id, var_addr = this.getEncodedVars()

        return {
            TMPL_PLATFORM_ID      : ps.token.id,
            TMPL_PLATFORM_FEE     : ps.fee,
            TMPL_PLATFORM_ADDR    : ps.address,

            TMPL_PRICE_MICROALGOS : `base64(${var_price})`,
            TMPL_ASSET_ID         : `base64(${var_id})`,
            TMPL_CREATOR_ADDR     : `base64(${var_addr})`
        }
    }

    async getCompiledProgram(){
        return await get_listing_compiled(this.getVars())
    }

    async getLsig(){
        const compiled_program = await this.getCompiledProgram()
        const program_bytes    = new Uint8Array(Buffer.from(compiled_program.result , "base64"));
        return algosdk.makeLogicSig(program_bytes);   
    }

    async createListing (wallet: Wallet) {
        const client = await getAlgodClient()

        this.creator_addr = wallet.getDefaultAccount()

        // Make logic sig for listing contract
        const compiled_program  = await this.getCompiledProgram()
        const program_bytes     = new Uint8Array(Buffer.from(compiled_program.result , "base64"));
        const lsig              = algosdk.makeLogicSig(program_bytes);   

        this.contract_addr =  compiled_program.hash

        // Seed listing contract account
        const seed_txn = await get_pay_txn(false, this.creator_addr, this.contract_addr, ps.seed)
        const stxn = await wallet.sign(seed_txn)

        await sendWait(stxn)

        
        let nft_optin = await get_optin_txn(true, this.contract_addr, this.asset_id)
        nft_optin = algosdk.signLogicSigTransactionObject(new algosdk.Transaction(nft_optin), lsig);
        sendWait(nft_optin)

        let platform_optin = await get_optin_txn(true, this.contract_addr, ps.token.id)
        platform_optin = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(platform_optin)
        platform_optin = algosdk.signLogicSigTransactionObject(platform_optin, lsig);
        await client.sendRawTransaction(platform_optin.blob).do()


        //// Fund listing
        const compiled_bytes              = await get_signed_platform_bytes()
        const var_price: string, var_id, var_addr = this.getEncodedVars()

        const delegate_program_bytes= new Uint8Array(Buffer.from(compiled_bytes , "base64"));
        const del_sig               = algosdk.logicSigFromByte(delegate_program_bytes)
        del_sig.args                = [ new Uint8Array(Buffer.from(var_price, "base64")), 
                                        new Uint8Array(Buffer.from(var_id, "base64")), 
                                        new Uint8Array(Buffer.from(program_bytes, "base64")) ]

        let asa_send      = await get_asa_txn(true, this.creator_addr, this.contract_addr, this.asset_id, 1)
        let asa_cfg       = await get_asa_cfg(true, this.creator_addr, this.asset_id, {
            manager: this.contract_addr, 
            reserve: this.contract_addr, 
            freeze:  this.contract_addr, 
            clawback:this.contract_addr
        })
        let pay_txn       = await get_pay_txn(true, this.creator_addr, this.contract_addr, ps.seed)
        let platform_send = await get_asa_txn(true, ps.address, this.contract_addr, ps.token.id, 1)

        asa_send      = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(asa_send)
        asa_cfg       = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject(asa_cfg)
        pay_txn       = algosdk.makePaymentTxnWithSuggestedParamsFromObject(pay_txn)
        platform_send = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(platform_send)

        const fund_txn_group = [asa_send, asa_cfg, pay_txn, platform_send]
        algosdk.assignGroupID(fund_txn_group)

        const s_asa_send      = wallet.sign(asa_send)
        const s_asa_cfg       = wallet.sign(asa_cfg)
        const s_seed_txn      = wallet.sign(pay_txn)
        const s_platform_send = algosdk.signLogicSigTransactionObject(platform_send, del_sig) 

        const {txid} = await client.sendRawTransaction([s_asa_send, s_asa_cfg, s_seed_txn, s_platform_send.blob]).do()
        await waitForConfirmation(client, txid, 2);
    }

    async destroy_listing(wallet){
        const client = await getAlgodClient()

        const creator_addr = wallet.getDefaultAccount()

        // goal asset send -a 0 -o delist-platform.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $PLATFORM_ACCT --close-to $PLATFORM_ACCT
        let platform_close = await get_asa_txn(false, this.contract_addr, ps.address, ps.token.id, 0)
        platform_close.closeRemainderTo = ps.address


        let asa_cfg = await get_asa_cfg(true, creator_addr, this.asset_id, {manager:creator_addr, reserve:creator_addr, freeze:creator_addr, clawback:creator_addr})
        
        // goal asset send -a 0 -o delist-nft.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CREATOR_ACCT --close-to $CREATOR_ACCT 
        let nft_close = await get_asa_txn(false, this.contract_addr, creator_addr, this.asset_id, 0)
        nft_close.closeRemainderTo = creator_addr

        // goal clerk send -a 0 -o delist-algo.txn -f $CONTRACT_ACCT -t $CREATOR_ACCT  -F $CONTRACT_NAME  --close-to $CREATOR_ACCT
        let algo_close = await get_pay_txn(false, this.contract_addr, creator_addr, 0)
        algo_close.closeRemainderTo = creator_addr

        // goal clerk group -i delist.txn -o delist.txn.grouped
        const destroy_txn_group = [platform_close, asa_cfg, nft_close, algo_close]
        algosdk.assignGroupID(destroy_txn_group)

        //Compile && sign listing


        // goal clerk sign -i delist.txn.grouped -o delist.txn.grouped.signed -p $CONTRACT_NAME
        // goal clerk rawsend -f delist.txn.grouped.signed
    }


    async purchase_listing(wallet: Wallet){
        const client = getAlgodClient()

        const buyer_addr = wallet.getDefaultAccount()
        //  Buyer Opt in to NFT
        //  goal asset send -a 0 --assetid $NFT_ID -f $BUYER_ACCT -t$BUYER_ACCT
        const nft_optin = await get_optin_txn(false, buyer_addr, this.asset_id)

        //   Send algos to creator
        //   goal clerk send -a 500 -o purchase-payment.txn -f $BUYER_ACCT -t $CREATOR_ACCT 
        const payment = await get_pay_txn(false, buyer_addr, this.creator_addr)

        //   Send NFT to buyer 
        //   goal asset send -a 1 -o purchase-nft.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $BUYER_ACCT --close-to $BUYER_ACCT
        let nft_xfer = await get_asa_txn(false, this.contract_addr,  buyer_addr, 1)
        nft_xfer.closeRemainderTo = buyer_addr

        // Reconfigure to to make the buyer the admin
        const asa_cfg = await get_asa_cfg(true, this.creator_addr, this.asset_id, {
            manager: this.creator_addr, 
            reserve: this.creator_addr, 
            freeze:  this.creator_addr, 
            clawback:this.creator_addr
        })

        //   Send a Platform Token to creator
        //   goal asset send -a 1 -o purchase-platform.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CREATOR_ACCT --close-to $PLATFORM_ACCT
        let platform_xfer = await get_asa_txn(false, this.contract_addr, ps.address, 1)
        platform_xfer.closeRemainderTo = ps.address


        //   Platform gets fee, rest closes out to creator
        //   goal clerk send -a 100 -o purchase-fee.txn -f $CONTRACT_ACCT -t $PLATFORM_ACCT --close-to $CREATOR_ACCT 
        let platform_fee = await get_pay_txn(false, this.contract_addr, ps.address, ps.fee)
        platform_fee.closeRemainderTo = this.creator_addr


        const purchase_group = [nft_optin, payment, nft_xfer, asa_cfg, platform_xfer, platform_fee]
        algosdk.assignGroupID(purchase_group)

        const s_nft_optin = wallet.sign(nft_optin)
        const s_payment = wallet.sign(payment)
        //const s_nft_xfer =  sign xfer by contract
        //const s_asa_cfg = sign reconf by contract
        //const s_platform_xfer = sign xfer by contract
        //const platform_fee = sign payment by contract
        
        //  #Sign
        //  ./sandbox goal clerk sign -i purchase-sub-0 -o purchase-sub-0.signed
        //  ./sandbox goal clerk sign -i purchase-sub-1 -o purchase-sub-1.signed -p $CONTRACT_NAME
        //  ./sandbox goal clerk sign -i purchase-sub-2 -o purchase-sub-2.signed -p $CONTRACT_NAME
        //  ./sandbox goal clerk sign -i purchase-sub-3 -o purchase-sub-3.signed -p $CONTRACT_NAME

        // ./sandbox goal clerk rawsend -f purchase.tx.signed
    }
}

export default listing;