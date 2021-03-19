import algosdk from 'algosdk'

const platform_settings = {
    algod : {
        token:"",
        server:"",
        port:0        
    },
    token: {
        name: "RareAF",
        unit: "RAF",
        total: 10000,
        id: 0
    },
    account: "",
    domain: "rare.af",
}


async function get_client(){
    const {token, server, port} = platform_settings.algod
    const client = new algosdk.Algodv2(token, server, port)
    return client
}

async function create_platform() {
    // If platform settings are empty this can get called

    // Create token with name and units
    // Create Delegated sig to give out this token
    // save

}

async function create_listing () {
    const client = get_client()
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