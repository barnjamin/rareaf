import { ControlBox } from '@chakra-ui/control-box'
import algosdk from 'algosdk'
import {decodeAddress} from 'algosdk/src/encoding/address'
import {platform_settings} from './platform-conf'
import template from '../contracts/listing.teal.tmpl'


export async function getClient(){
    const {token, server, port} = platform_settings.algod
    return new algosdk.Algodv2(token, server, port)
}

export async function create_platform() {
    // If platform settings are empty this can get called

    // Create token with name and units
    // Create Delegated sig to give out this token
    // save
    return

}

export async function createListing (addr, price, asset_id) {
    const client = await getClient()
    console.log(client)

    let variables = {
        TMPL_PLATFORM_ID:platform_settings.token.id,
        TMPL_PLATFORM_FEE:platform_settings.fee,
        TMPL_PLATFORM_ADDR:platform_settings.address
    }

    const pricebytes = (price).toString(16)
    variables.TMPL_PRICE_MICROALGOS = "0x"+ "0".repeat(8 - pricebytes.length) + pricebytes

    const assetbytes = (asset_id).toString(16)
    variables.TMPL_ASSET_ID = "0x"+ "0".repeat(8 - assetbytes.length) + assetbytes

    const tmpaddr = decodeAddress(addr)
    variables.TMPL_CREATOR_ADDR = "0x" +Buffer.from(tmpaddr.publicKey).toString('hex')

    console.log(variables)

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

    console.log(program)
    const compiledProgram = await client.compile(program).do();
    //const programBytes = new Uint8Array(
    //  Buffer.from(compiledProgram.result, 'base64')
    //);

    // source ./vars.sh
    // 
    // echo "Creator funding contract acct with algos"
    // ./sandbox goal clerk send -a 500000  -f$CREATOR_ACCT -t$CONTRACT_ACCT
    // 
    // echo "Contract Account Opting into NFT"
    // ./sandbox goal asset send -a 0 -o nft-opt-in.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
    // ./sandbox goal clerk sign -i nft-opt-in.txn -o nft-opt-in.txn.signed -p $CONTRACT_NAME
    // ./sandbox goal clerk rawsend -f nft-opt-in.txn.signed
    // 
    // echo "Contract Acct Opting into Platform token"
    // ./sandbox goal asset send -a 0 -o platform-opt-in.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
    // ./sandbox goal clerk sign -i platform-opt-in.txn -o platform-opt-in.txn.signed -p $CONTRACT_NAME
    // ./sandbox goal clerk rawsend -f platform-opt-in.txn.signed



    // Compile 
    // Check user opted into PlatformToken
    // If not, opt into PlatformToken 

    // Compile Teal script with appropriate arguments (nft_id, price, creator acct)
    // Set contract acct variable

    // Fund contract acct with 5 algos 
    // Note contains teal source in case its lost

    // Contract acct Opt into NFT
    // Contract acct Opt into Platform Tokens 

    // Send Tx with 
    //   Delegated Sig PlatformToken xfer 
    //   Contract Sig NFT xfer
    //   Contract Sig NFT manager change 
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