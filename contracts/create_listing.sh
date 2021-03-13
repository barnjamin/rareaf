#!/bin/bash

cp ~/rareaf/contracts/listing.teal .
./sandbox copy listing.teal


CREATOR_ACCT=LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI
NFT_ID=2
PLATFORM_ID=1
CONTRACT_NAME=listing.teal
PLATFORM_ACCT=UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA
CONTRACT_ACCT=`./sandbox goal clerk compile -a$CREATOR_ACCT $CONTRACT_NAME  | awk '{print $2}' | tr '\r' ' '`
echo "Contract account: $CONTRACT_ACCT"


#Creator must Opt platform token 
echo "Opting into Platform token"
./sandbox goal asset send -a 0 --assetid $PLATFORM_ID -f $CREATOR_ACCT -t $CREATOR_ACCT


echo "Funding contract acct with algos"
#echo "Sending Algos"
./sandbox goal clerk send -a 500000  -f$CREATOR_ACCT -t$CONTRACT_ACCT


echo "Opting into NFT"
#Creates Tx file, sign, send
./sandbox goal asset send -a 0 -o nft-opt-in.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
./sandbox goal clerk sign -i nft-opt-in.txn -o nft-opt-in.txn.signed -p $CONTRACT_NAME
./sandbox goal clerk rawsend -f nft-opt-in.txn.signed

echo "Opting into Platform"
#Creates Tx file, sign, send
./sandbox goal asset send -a 0 -o platform-opt-in.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
./sandbox goal clerk sign -i platform-opt-in.txn -o platform-opt-in.txn.signed -p $CONTRACT_NAME
./sandbox goal clerk rawsend -f platform-opt-in.txn.signed

#Send ASAs
echo "Funding contract acct with assets"
./sandbox goal asset send -a 1 --assetid $NFT_ID -f $CREATOR_ACCT -t $CONTRACT_ACCT
./sandbox goal asset send -a 2 --assetid $PLATFORM_ID -f $PLATFORM_ACCT -t $CONTRACT_ACCT
