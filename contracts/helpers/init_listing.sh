#!/bin/bash

CONTRACT_NAME=listing.teal
DELEGATE_NAME=platform.teal

cp ~/rareaf/contracts/$CONTRACT_NAME .
./sandbox copy $CONTRACT_NAME

cp ~/rareaf/contracts/$DELEGATE_NAME .
./sandbox copy $DELEGATE_NAME

CREATOR_ACCT=OVMCDUOLZQX23CIKYEUTBCUWW44H6IYF64LY5736HAV5TQNP77JKS45YZA
NFT_ID=2

PLATFORM_ID=1
PLATFORM_ACCT=NFMVG5PCLPEWGL5ACNHYEZOIUHXJBUW4SI754W6APBCCRUVVJKRQOAFAE4


DELEGATE_SIG=`./sandbox goal clerk compile -a$PLATFORM_ACCT $DELEGATE_NAME | awk '{print $2}' | tr '\r' ' '`
CONTRACT_ACCT=`./sandbox goal clerk compile -a$CREATOR_ACCT $CONTRACT_NAME | awk '{print $2}' | tr '\r' ' '`

echo "Delegate sig: $DELEGATE_SIG"
echo "Contract account: $CONTRACT_ACCT"


echo "Creator Opting into Platform token"
./sandbox goal asset send -a 0 --assetid $PLATFORM_ID -f $CREATOR_ACCT -t $CREATOR_ACCT

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

