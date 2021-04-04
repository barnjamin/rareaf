import { ControlBox } from '@chakra-ui/control-box'
import {platform_settings as ps} from './platform-conf'
import template from '../contracts/listing.teal.tmpl'

import algosdk from 'algosdk'
import {decodeAddress} from 'algosdk/src/encoding/address'
import { get_pay_txn, get_optin_txn, sign, send } from './algorand'
//import {encodeUint64} from 'algosdk/src/encoding/uint64'
const Buffer = require('buffer/').Buffer


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

export async function createListing (addr, price, asset_id) {
    const client = await getClient()

    const arg_price = Buffer.from(encodeUint64(price)).toString('base64')
    const arg_id = Buffer.from(encodeUint64(asset_id)).toString('base64')

    const tmpaddr = decodeAddress(addr)
    const arg_addr =  Buffer.from(tmpaddr.publicKey).toString('base64')

    let variables = {
        TMPL_PLATFORM_ID      : ps.token.id,
        TMPL_PLATFORM_FEE     : ps.fee,
        TMPL_PLATFORM_ADDR    : ps.address,

        TMPL_PRICE_MICROALGOS : `base64(${arg_price})`,
        TMPL_ASSET_ID         : `base64(${arg_id})`,
        TMPL_CREATOR_ADDR     : `base64(${arg_addr})`
    }

    const program =  await fetch(template)
    .then(response => checkStatus(response) && response.arrayBuffer())
    .then(buffer => {
        const td = new TextDecoder()
        let program = td.decode(buffer)
        for(let v in variables){
            program = program.replace("$"+v, variables[v])
        }
        return program
    }).catch(err => console.error(err)); 

    const compiledProgram = await client.compile(program).do();

    const contract_addr = compiledProgram.hash

    console.log(contract_addr)
    console.log(arg_price)
    console.log(arg_id)
    console.log(compiledProgram.result)

   // let program_bytes = new Uint8Array(Buffer.from(compiledProgram.result , "base64"));
   // let lsig = algosdk.makeLogicSig(program_bytes);   

   // console.log(lsig.address())

   // // create a transaction
   // let sender = lsig.address();
   // let receiver = lsig.address();
   // let amount = 10000;
   // let closeToRemaninder = undefined;
   // let note = undefined;
   // let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, closeToRemaninder, note, params)
   // console.log(txn);


    // //integer parameter
    // let args = [[123]];
    // let lsig = algosdk.makeLogicSig(program, args);

    // echo "Creator funding contract acct with algos"
    //const seed_txn = await get_pay_txn(addr, contract_addr, ps.seed)
    //console.log(seed_txn)
    //const signed_seed_txn = await sign(seed_txn)
    //console.log(signed)
     
    // echo "Contract Account Opting into NFT"
    //const nft_optin = await get_optin_txn(contract_addr, asset_id)
    //console.log(nft_optin)
    //const nft_optin_signed = await sign(nft_optin) 
    //console.log(nft_optin_signed)

    // ./sandbox goal asset send -a 0 -o nft-opt-in.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
    // ./sandbox goal clerk sign -i nft-opt-in.txn -o nft-opt-in.txn.signed -p $CONTRACT_NAME
    // ./sandbox goal clerk rawsend -f nft-opt-in.txn.signed
     
    // echo "Contract Acct Opting into Platform token"
    // ./sandbox goal asset send -a 0 -o platform-opt-in.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
    // ./sandbox goal clerk sign -i platform-opt-in.txn -o platform-opt-in.txn.signed -p $CONTRACT_NAME
    // ./sandbox goal clerk rawsend -f platform-opt-in.txn.signed

}

async function destroy_listing(){
    const client = algosdk.Algodv2()

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
    const client = algosdk.Algodv2()
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

function checkStatus(response) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
}