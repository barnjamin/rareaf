#!/bin/bash

source ./vars.sh

## Send Platform tokens back to platform acct
./sandbox goal asset send -a 0 -o delist-platform.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $PLATFORM_ACCT --close-to $PLATFORM_ACCT
#./sandbox goal clerk sign -i delist-platform.txn -o delist-platform.txn.signed -p $CONTRACT_NAME

## Send nft back to creator
./sandbox goal asset send -a 0 -o delist-nft.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $CREATOR_ACCT --close-to $CREATOR_ACCT 
#./sandbox goal clerk sign -i delist-nft.txn -o delist-nft.txn.signed -p $CONTRACT_NAME

## Send algos back go creator
./sandbox goal clerk send -a 0 -o delist-algo.txn -f $CONTRACT_ACCT -t $CREATOR_ACCT  -F $CONTRACT_NAME  --close-to $CREATOR_ACCT


#Combine them all
#cat delist-platform.txn.signed delist-nft.txn.signed delist-algo.txn.signed > delist.txn
#./sandbox goal clerk group -i delist.txn -o delist.txn.grouped
#
##Sign it
#./sandbox goal clerk sign -i delist.txn.grouped -o delist.txn.grouped.signed -p $CONTRACT_NAME
#
##Send it
#./sandbox goal clerk rawsend -f delist.txn.grouped.signed
