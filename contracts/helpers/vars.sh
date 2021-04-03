#!/bin/bash

echo "Sourcing vars"

export PLATFORM_ACCT=ZGAWJJXOUDT2E5CJ2KJMUZ4HYHYZVUSES3A6DYPPEYCNYPOMN3CQOCVVB4
export CREATOR_ACCT=MNSKOVSAY3ZDU3I3IB3KLO4HVRAP3PXKTIERMEVYYS463Y3UKTAS6NNIYQ

export CONTRACT_NAME=listing.teal
export DELEGATE_NAME=platform.teal

export NFT_ID=2
export PLATFORM_ID=1

cp ~/rareaf/contracts/$CONTRACT_NAME .
./sandbox copy $CONTRACT_NAME

cp ~/rareaf/contracts/$CONTRACT_NAME.tok .
./sandbox copy $CONTRACT_NAME.tok

cp ~/rareaf/contracts/$DELEGATE_NAME .
./sandbox copy $DELEGATE_NAME

export DELEGATE_SIG=`./sandbox goal clerk compile -a$PLATFORM_ACCT $DELEGATE_NAME | awk '{print $2}' | tr '\r' ' '`
export CONTRACT_ACCT=`./sandbox goal clerk compile -a$CREATOR_ACCT $CONTRACT_NAME | awk '{print $2}' | tr '\r' ' '`

echo "Delegate sig: $DELEGATE_SIG"
echo "Contract account: $CONTRACT_ACCT"
