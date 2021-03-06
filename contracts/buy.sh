#!/bin/bash

BUYER=UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA
SELLER=LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI
ALGO_AMOUNT=100
ASSET_ID=3

#Buyer opts into asset
./sandbox goal asset send -a0 -f $BUYER -t $BUYER --assetid $ASSET_ID

#Sign asset transfer TX with logic sig and write to file
./sandbox goal asset send -f $SELLER -t $BUYER -a1 --assetid $ASSET_ID -o asset_tx.txn -L sell.lsig

#Prepare buyer algo tx and write to file
./sandbox goal clerk send -f $BUYER -t $SELLER -a $ALGO_AMOUNT -o algo_tx.txn

#Combine txns
# ./sandbox enter algod
# run `cat asset_tx.txn algo_tx.txn > combined.txn`
# exit

#Group txns
./sandbox goal group -i combined.txn -o grouped.txn

#Buyer signs grouped txn
./sandbox goal sign -i grouped.txn -o grouped.txn.signed

#Send the transaction
./sandbox goal rawsend -f grouped.txn.signed

