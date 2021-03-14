#!/bin/bash

PLATFORM_ACCT=UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA
PLATFORM_ID=1

CREATOR_ACCT=LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI
NFT_ID=2

CONTRACT_NAME=listing.teal
CONTRACT_ACCT=`./sandbox goal clerk compile -a$CREATOR_ACCT $CONTRACT_NAME  | awk '{print $2}' | tr '\r' ' '`

BUYER_ACCT=XNPT5ACLQCLV4G634422RH4R7NXST3HAYLEN7ZCAMTD6FUONRSAE4P2SAE

# #Opt in to asset
# ./sandbox goal asset send -a 0 --assetid $NFT_ID -f $BUYER_ACCT -t$BUYER_ACCT
# 
# # Send algos to creator
# ./sandbox goal clerk send -a 500 -o purchase-payment.txn -f $BUYER_ACCT -t $CREATOR_ACCT 
# 
# # Send NFT to buyer 
# ./sandbox goal asset send -a 1 -o purchase-nft.txn --assetid $NFT_ID -f $CONTRACT_ACCT -t $BUYER_ACCT --close-to $BUYER_ACCT
# 
# # Send a Platform Token to creator
# ./sandbox goal asset send -a 1 -o purchase-platform.txn --assetid $PLATFORM_ID -f $CONTRACT_ACCT -t $CREATOR_ACCT --close-to $PLATFORM_ACCT
# 
# # Platform gets fee, rest closes out to creator
# ./sandbox goal clerk send -a 100 -o purchase-fee.txn -f $CONTRACT_ACCT -t $PLATFORM_ACCT --close-to $CREATOR_ACCT 
# 
# 
# #Combine
# #cat purchase-payment.txn purchase-nft.txn purchase-platform.txn purchase-fee.txn > purchase.txn
# 
# #Assign Group IDs
# ./sandbox goal clerk group -i purchase.txn -o purchase.txn.grouped
# 
# #Split for singing
# ./sandbox goal clerk split -i purchase.txn.grouped -o purchase-sub
# 
# #Sign
# ./sandbox goal clerk sign -i purchase-sub-0 -o purchase-sub-0.signed
# ./sandbox goal clerk sign -i purchase-sub-1 -o purchase-sub-1.signed -p $CONTRACT_NAME
# ./sandbox goal clerk sign -i purchase-sub-2 -o purchase-sub-2.signed -p $CONTRACT_NAME
# ./sandbox goal clerk sign -i purchase-sub-3 -o purchase-sub-3.signed -p $CONTRACT_NAME

#Recombine
#cat purchase-sub-0.signed purchase-sub-1.signed purchase-sub-2.signed purchase-sub-3.signed > purchase.tx.signed

./sandbox goal clerk rawsend -f purchase.tx.signed
