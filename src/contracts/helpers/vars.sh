#!/bin/bash

echo "Sourcing vars"

export PLATFORM_ACCT=7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM
export CREATOR_ACCT=6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI

export CONTRACT_NAME=listing.teal
export DELEGATE_NAME=platform.teal

export LISTING_PRICE=500
export NFT_ID=2
export PLATFORM_ID=1

cp ~/rareaf/contracts/$CONTRACT_NAME .
./sandbox copy $CONTRACT_NAME

goal clerk compile $CONTRACT_NAME
./sandbox copy $CONTRACT_NAME.tok

cp ~/rareaf/contracts/$DELEGATE_NAME .
./sandbox copy $DELEGATE_NAME

export DELEGATE_SIG=`./sandbox goal clerk compile -a$PLATFORM_ACCT $DELEGATE_NAME | awk '{print $2}' | tr '\r' ' '`
export CONTRACT_ACCT=`./sandbox goal clerk compile -a$CREATOR_ACCT $CONTRACT_NAME | awk '{print $2}' | tr '\r' ' '`


echo "Delegate sig: $DELEGATE_SIG"
echo "Contract account: $CONTRACT_ACCT"
