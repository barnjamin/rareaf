#!/bin/bash

source ./vars.sh

echo "Creator funding contract acct with algos"
./sandbox goal clerk send -a 500000  -f$CREATOR_ACCT -t$CONTRACT_ACCT

echo "Contract Account Opting into NFT"
./sandbox goal asset send -a 0 -o nft-opt-in.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
./sandbox goal clerk sign -i nft-opt-in.txn -o nft-opt-in.txn.signed -p $CONTRACT_NAME
./sandbox goal clerk rawsend -f nft-opt-in.txn.signed

echo "Contract Acct Opting into Platform token"
./sandbox goal asset send -a 0 -o platform-opt-in.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT
./sandbox goal clerk sign -i platform-opt-in.txn -o platform-opt-in.txn.signed -p $CONTRACT_NAME
./sandbox goal clerk rawsend -f platform-opt-in.txn.signed

