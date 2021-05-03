import {platform_settings as ps} from './platform-conf'
import listing_template from '../contracts/listing.teal.tmpl'
import platform_delegate_signed from '../contracts/platform.signed'
import { 
    send, waitForConfirmation,
    get_asa_cfg, get_teal, get_pay_txn, get_optin_txn, 
    populate_contract, get_asa_txn
} from './algorand'

import algosdk from 'algosdk';

export async function createListing (price, asset_id, wallet) {
    const client = await getClient()

    const creator_addr = wallet.getDefaultAccount()

    console.log(price, asset_id)

    // Encode vars for inclusion in contract
    const var_price = Buffer.from(algosdk.encodeUint64(price)).toString('base64')
    const var_id    = Buffer.from(algosdk.encodeUint64(asset_id)).toString('base64')
    const var_addr  = Buffer.from(algosdk.decodeAddress(creator_addr).publicKey).toString('base64')

    const vars = {
        TMPL_PLATFORM_ID      : ps.token.id,
        TMPL_PLATFORM_FEE     : ps.fee,
        TMPL_PLATFORM_ADDR    : ps.address,

        TMPL_PRICE_MICROALGOS : `base64(${var_price})`,
        TMPL_ASSET_ID         : `base64(${var_id})`,
        TMPL_CREATOR_ADDR     : `base64(${var_addr})`
    }

    //Swap tmpl vars for actual values
    const populated_program = await populate_contract(listing_template, vars)

    // Compile program, create logic sig 
    const compiled_program  = await client.compile(populated_program).do();
    const contract_addr     = compiled_program.hash

    console.log(contract_addr)

    // Make logic sig for listing contract
    const program_bytes     = new Uint8Array(Buffer.from(compiled_program.result , "base64"));
    const lsig              = algosdk.makeLogicSig(program_bytes);   

    const seed_txn = await get_pay_txn(false, creator_addr, contract_addr, ps.seed)
    const stxn = await wallet.sign(seed_txn)
    console.log("Sending payment")
    await send(stxn)

    
    let nft_optin = await get_optin_txn(true, contract_addr, asset_id)
    nft_optin = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(nft_optin)
    nft_optin = algosdk.signLogicSigTransactionObject(nft_optin, lsig);
    console.log("Opting into nft")
    await client.sendRawTransaction(nft_optin.blob).do()

    let platform_optin = await get_optin_txn(true, contract_addr, ps.token.id)
    platform_optin = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(platform_optin)
    platform_optin = algosdk.signLogicSigTransactionObject(platform_optin, lsig);
    console.log("Opting into platform")
    await client.sendRawTransaction(platform_optin.blob).do()


    //// Fund listing
    const compiled_bytes        = await get_teal(platform_delegate_signed)
    const delegate_program_bytes= new Uint8Array(Buffer.from(compiled_bytes , "base64"));
    const del_sig               = algosdk.logicSigFromByte(delegate_program_bytes)
    del_sig.args                = [ new Uint8Array(Buffer.from(var_price, "base64")), 
                                    new Uint8Array(Buffer.from(var_id, "base64")), 
                                    new Uint8Array(Buffer.from(program_bytes, "base64")) ]

    let asa_send      = await get_asa_txn(true, creator_addr, contract_addr, asset_id, 1)
    let asa_cfg       = await get_asa_cfg(true, creator_addr, asset_id, {manager:contract_addr, reserve:contract_addr, freeze:contract_addr, clawback:contract_addr})
    let pay_txn       = await get_pay_txn(true, creator_addr, contract_addr, ps.seed)
    let platform_send = await get_asa_txn(true, ps.address, contract_addr, ps.token.id, 1)

    asa_send      = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(asa_send)
    asa_cfg       = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject(asa_cfg)
    pay_txn       = algosdk.makePaymentTxnWithSuggestedParamsFromObject(pay_txn)
    platform_send = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(platform_send)

    const fund_txn_group = [asa_send, asa_cfg, pay_txn, platform_send]
    algosdk.assignGroupID(fund_txn_group)

    const s_asa_send      = wallet.sign(asa_send, creator_addr)
    const s_asa_cfg       = wallet.sign(asa_cfg, creator_addr)
    const s_seed_txn      = wallet.sign(pay_txn, creator_addr)
    const s_platform_send = algosdk.signLogicSigTransactionObject(platform_send, del_sig) 

    download_txns("grouped.txns", [s_asa_send, s_asa_cfg, s_seed_txn, s_platform_send.blob])
    const {txid} = await client.sendRawTransaction([s_asa_send, s_asa_cfg, s_seed_txn, s_platform_send.blob]).do()
    await waitForConfirmation(client, txid, 2);

    return contract_addr
}

async function destroy_listing(contract_addr, creator_addr, asset_id){
    const client = await getClient()


    // goal asset send -a 0 -o delist-platform.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $PLATFORM_ACCT --close-to $PLATFORM_ACCT
    let platform_close = await get_asa_txn(false, contract_addr, ps.address, ps.token.id, 0)
    platform_close.closeRemainderTo = ps.address


    let asa_cfg = await get_asa_cfg(true, creator_addr, asset_id, {manager:creator_addr, reserve:creator_addr, freeze:creator_addr, clawback:creator_addr})
    
    // goal asset send -a 0 -o delist-nft.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CREATOR_ACCT --close-to $CREATOR_ACCT 
    let nft_close = await get_asa_txn(false, contract_addr, creator_addr, asset_id, 0)
    nft_close.closeRemainderTo = creator_addr

    // goal clerk send -a 0 -o delist-algo.txn -f $CONTRACT_ACCT -t $CREATOR_ACCT  -F $CONTRACT_NAME  --close-to $CREATOR_ACCT
    let algo_close = await get_pay_txn(false, contract_addr, creator_addr, 0)
    algo_close.closeRemainderTo = creator_addr

    // goal clerk group -i delist.txn -o delist.txn.grouped
    const destroy_txn_group = [platform_close, asa_cfg, nft_close, algo_close]
    algosdk.assignGroupID(destroy_txn_group)




    // goal clerk sign -i delist.txn.grouped -o delist.txn.grouped.signed -p $CONTRACT_NAME
    // goal clerk rawsend -f delist.txn.grouped.signed
}


async function purchase_listing(){
    //const client = algosdk.Algodv2()
    //  Buyer Opt in to NFT
    //  goal asset send -a 0 --assetid $NFT_ID -f $BUYER_ACCT -t$BUYER_ACCT

    //   Send algos to creator
    //   goal clerk send -a 500 -o purchase-payment.txn -f $BUYER_ACCT -t $CREATOR_ACCT 
    //  
    //   Send NFT to buyer 
    //   goal asset send -a 1 -o purchase-nft.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $BUYER_ACCT --close-to $BUYER_ACCT
    //  
    //   Send a Platform Token to creator
    //   goal asset send -a 1 -o purchase-platform.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CREATOR_ACCT --close-to $PLATFORM_ACCT
    //  
    //   Platform gets fee, rest closes out to creator
    //   goal clerk send -a 100 -o purchase-fee.txn -f $CONTRACT_ACCT -t $PLATFORM_ACCT --close-to $CREATOR_ACCT 
    //  
    //  #Assign Group IDs
    //  ./sandbox goal clerk group -i purchase.txn -o purchase.txn.grouped
    //  
    //  #Sign
    //  ./sandbox goal clerk sign -i purchase-sub-0 -o purchase-sub-0.signed
    //  ./sandbox goal clerk sign -i purchase-sub-1 -o purchase-sub-1.signed -p $CONTRACT_NAME
    //  ./sandbox goal clerk sign -i purchase-sub-2 -o purchase-sub-2.signed -p $CONTRACT_NAME
    //  ./sandbox goal clerk sign -i purchase-sub-3 -o purchase-sub-3.signed -p $CONTRACT_NAME
    // 
    // 
    // ./sandbox goal clerk rawsend -f purchase.tx.signed
}