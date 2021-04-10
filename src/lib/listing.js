import {platform_settings as ps} from './platform-conf'
import listing_template from '../contracts/listing.teal.tmpl'
import platform_delegate from '../contracts/platform.teal'
import platform_delegate_signed from '../contracts/platform.signed'
import { get_teal, get_pay_txn, get_optin_txn, sign, send, populate_contract, get_asa_txn } from './algorand'

const Buffer = require('buffer/').Buffer

import 'algosdk';


export async function getClient(){
    const {token, server, port} = ps.algod
    return new algosdk.Algodv2(token, server, port)
}

export async function create_platform() {
    // If platform settings are empty this can get called

    // Create token with name and units
    // Create Delegated sig to give out this token
    // save
    return
}

export function encodeUint64(num) {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigUInt64BE(BigInt(num));
    return new Uint8Array(buf);
}

export async function createListing (creator_addr, price, asset_id) {
    const client = await getClient()

    // Encode vars for inclusion in contract
    // TODO: do this in populate_contract
    const var_price = Buffer.from(encodeUint64(price)).toString('base64')
    const var_id    = Buffer.from(encodeUint64(asset_id)).toString('base64')
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

    // Make logic sig for listing contract
    const program_bytes     = new Uint8Array(Buffer.from(compiled_program.result , "base64"));
    const lsig              = algosdk.makeLogicSig(program_bytes);   


    /// Initialize listing
    //console.log("Seeding contract acct")
    //let seed_txn = await get_pay_txn(creator_addr, contract_addr, ps.seed)
    //seed_txn = await sign(seed_txn)
    //await send(seed_txn)

    //console.log("Opting contract acct into nft")
    //let nft_optin = await get_optin_txn(contract_addr, asset_id)
    //nft_optin = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(nft_optin)
    //nft_optin = algosdk.signLogicSigTransactionObject(nft_optin, lsig);
    //await client.sendRawTransaction(nft_optin.blob).do()
    //console.log("Opted in")

    //console.log("Opting contract acct into platform")
    //let platform_optin = await get_optin_txn(contract_addr, ps.token.id)
    //platform_optin = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(platform_optin)
    //platform_optin = algosdk.signLogicSigTransactionObject(platform_optin, lsig);
    //await client.sendRawTransaction(platform_optin.blob).do()
    //console.log("Opted in")


    //// Fund listing

    //const delegate_program      = await get_teal(platform_delegate)
    //const compiled_delegate     = await client.compile(delegate_program).do()
    //const delegate_program_bytes= new Uint8Array(Buffer.from(compiled_delegate.result , "base64"));

    const compiled_bytes        = await get_teal(platform_delegate_signed)
    const delegate_program_bytes= new Uint8Array(Buffer.from(compiled_bytes , "base64"));
    const del_sig = algosdk.logicSigFromByte(delegate_program_bytes)
    del_sig.args = [var_price, var_id, program_bytes]
    console.log(del_sig)

    
    ////TODO: variable amount
    //let asa_send = get_asa_txn(creator_addr, contract_addr, asset_id, 1)
    //let asa_cfg = get_asa_cfg(creator_addr, asset_id, {})
    //let fee_txn = get_pay_txn(creator_addr, contract_addr, ps.fee)
    //let platform_send  = get_asa_txn(ps.address, contract_addr, ps.token.id, 1)

    //const fund_txn_group = [asa_send, asa_cfg, fee_txn, platform_send]
    //algosdk.assignGroupID(fund_txn_group)
    
    //asa_send = await sign(asa_send)
    //asa_cfg = await sign(asa_cfg)
    //fee_txn = await sign(fee_txn)

    ////b64_price=`python3 -c "import base64;print(base64.b64encode(($LISTING_PRICE).to_bytes(8,'big')).decode('ascii'))"`
    ////b64_nft_id=`python3 -c "import base64;print(base64.b64encode(($NFT_ID).to_bytes(8,'big')).decode('ascii'))"`
    ////./sandbox goal clerk sign -i split-3 -o $PLATFORM_SEND -L$SIGNED_DELEGATE --argb64 $b64_price  --argb64 $b64_nft_id --argb64 `cat $CONTRACT_NAME.tok | base64 -w0`
    //platform_send = algosdk.signLogicSigTransactionObject(platform_send, platform_sig, args);

    ////echo "Sned it"
    ////./sandbox goal clerk rawsend -f $COMBINED
    //const {txid} = await client.sendRawTransaction(fund_txn_group)

    //console.log('Awaiting confirmation (this will take several seconds)...');
    //const roundTimeout = 2;
    //await utils.waitForConfirmation(client, txId, roundTimeout);
    //console.log('Transactions successful.');
}

async function fund_listing(){




}

async function destroy_listing(){
    //const client = algosdk.Algodv2()

    // Send assets and algos back to creator or platform wallet 
    // goal asset send -a 0 -o delist-platform.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $PLATFORM_ACCT --close-to $PLATFORM_ACCT
    // goal asset send -a 0 -o delist-nft.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CREATOR_ACCT --close-to $CREATOR_ACCT 
    // goal clerk send -a 0 -o delist-algo.txn -f $CONTRACT_ACCT -t $CREATOR_ACCT  -F $CONTRACT_NAME  --close-to $CREATOR_ACCT

    // todo: change nft manager back to creator

    // goal clerk group -i delist.txn -o delist.txn.grouped
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
