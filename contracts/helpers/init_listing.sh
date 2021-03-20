#!/bin/bash

CONTRACT_NAME=listing.teal
DELEGATE_NAME=platform-token-mint.teal

cp ~/rareaf/contracts/$CONTRACT_NAME .
./sandbox copy $CONTRACT_NAME

cp ~/rareaf/contracts/$DELEGATE_NAME .
./sandbox copy $DELEGATE_NAME

CREATOR_ACCT=LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI
NFT_ID=2

PLATFORM_ID=1
PLATFORM_ACCT=UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA

#b64_creator=`echo -n $CREATOR_ACCT | base64 -w0`


DELEGATE_SIG=`./sandbox goal clerk compile -a$PLATFORM_ACCT $DELEGATE_NAME | awk '{print $2}' | tr '\r' ' '`
CONTRACT_ACCT=`./sandbox goal clerk compile -a$CREATOR_ACCT $CONTRACT_NAME | awk '{print $2}' | tr '\r' ' '`

echo "Delegate sig: $DELEGATE_SIG"
echo "Contract account: $CONTRACT_ACCT"


echo "Opting into Platform token"
./sandbox goal asset send -a 0 --assetid $PLATFORM_ID -f $CREATOR_ACCT -t $CREATOR_ACCT

echo "Funding contract acct with algos"
./sandbox goal clerk send -a 500000  -f$CREATOR_ACCT -t$CONTRACT_ACCT

echo "Contract Account Opting into NFT"
./sandbox goal asset send -a 0 -o nft-opt-in.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
./sandbox goal clerk sign -i nft-opt-in.txn -o nft-opt-in.txn.signed -p $CONTRACT_NAME
./sandbox goal clerk rawsend -f nft-opt-in.txn.signed

echo "Opting into Platform"
./sandbox goal asset send -a 0 -o platform-opt-in.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
./sandbox goal clerk sign -i platform-opt-in.txn -o platform-opt-in.txn.signed -p $CONTRACT_NAME
./sandbox goal clerk rawsend -f platform-opt-in.txn.signed


#Send ASAs
#echo "Funding contract acct with assets"
#./sandbox goal asset send -a 1 --assetid $NFT_ID -f $CREATOR_ACCT -t $CONTRACT_ACCT
#./sandbox goal asset send -a 2 --assetid $PLATFORM_ID -f $PLATFORM_ACCT -t $CONTRACT_ACCT


b64_price=`python3 -c "import base64;print(base64.b64encode((10000).to_bytes(8,'big')).decode('ascii'))"`
b64_nft_id=`python3 -c "import base64;print(base64.b64encode((2).to_bytes(8,'big')).decode('ascii'))"`
#--argb64 $b64_price  --argb64 $b64_nft_id 
