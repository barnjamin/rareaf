#!/bin/bash

CONTRACT_NAME=listing.teal
DELEGATE_NAME=platform-token-mint.teal
SIGNED_DELEGATE=platform-delegate.signed

#cp ~/rareaf/contracts/$CONTRACT_NAME .
#./sandbox copy $CONTRACT_NAME
#
#cp ~/rareaf/contracts/$DELEGATE_NAME .
#./sandbox copy $DELEGATE_NAME

CREATOR_ACCT=LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI
NFT_ID=2

PLATFORM_ID=1
PLATFORM_ACCT=UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA

DELEGATE_SIG=`./sandbox goal clerk compile -a$PLATFORM_ACCT $DELEGATE_NAME | awk '{print $2}' | tr '\r' ' '`
CONTRACT_ACCT=`./sandbox goal clerk compile -a$CREATOR_ACCT $CONTRACT_NAME | awk '{print $2}' | tr '\r' ' '`

echo "Delegate sig: $DELEGATE_SIG"
echo "Contract account: $CONTRACT_ACCT"


ASA_SEND=asa_send.txn
ASA_CFG=asa_cfg.txn
FUND_ACCT=fund_acct.txn
PLATFORM_SEND=platform_send.txn
COMBINED=fund.txn

echo "Signing delegate sig"
./sandbox goal clerk compile $DELEGATE_NAME -a $PLATFORM_ACCT -s -o $SIGNED_DELEGATE 

echo "Creating Txns"
./sandbox goal asset send -a 1 --assetid $NFT_ID -f $CREATOR_ACCT -t $CONTRACT_ACCT -o $ASA_SEND --noteb64 `cat $CONTRACT_NAME | base64 -w0`
./sandbox goal asset config --assetid $NFT_ID --manager $CREATOR_ACCT --new-manager $CONTRACT_ACCT -o $ASA_CFG 
./sandbox goal clerk send -a 1000000000 -f $CREATOR_ACCT -t $CONTRACT_ACCT -o $FUND_ACCT 
./sandbox goal asset send -a 1 --assetid $PLATFORM_ID -f $PLATFORM_ACCT -t $CONTRACT_ACCT -o $PLATFORM_SEND 

echo "Combining Txns"
./sandbox exec "cat $ASA_SEND $ASA_CFG $FUND_ACCT $PLATFORM_SEND > $COMBINED"

echo "Grouping/Splitting Txns"
./sandbox goal clerk group -i $COMBINED  -o $COMBINED
./sandbox goal clerk split -i $COMBINED  -o split

echo "Signing individual Txns"
./sandbox goal clerk sign -i split-0 -o $ASA_SEND
./sandbox goal clerk sign -i split-1 -o $ASA_CFG
./sandbox goal clerk sign -i split-2 -o $FUND_ACCT

echo "Signing delegate sig"
b64_price=`python3 -c "import base64;print(base64.b64encode((10000).to_bytes(8,'big')).decode('ascii'))"`
b64_nft_id=`python3 -c "import base64;print(base64.b64encode((2).to_bytes(8,'big')).decode('ascii'))"`
./sandbox goal clerk sign -i split-3 -o $PLATFORM_SEND --argb64 $b64_price  --argb64 $b64_nft_id -L$SIGNED_DELEGATE 

echo "Recombining Txns"
./sandbox exec "cat $ASA_SEND $ASA_CFG $FUND_ACCT $PLATFORM_SEND > $COMBINED"

echo "Sned it"
./sandbox goal rawsend -f $COMBINED
