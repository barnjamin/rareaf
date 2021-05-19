#!/bin/bash

source ./vars.sh


SEED_ACCT=seed_acct.txn

ASA_OPT_IN=asa_optin.txn
PRICE_OPT_IN=price_optin.txn

PRICE_SEND=platform_send.txn
ASA_SEND=asa_send.txn

ASA_CFG=asa_cfg.txn

APP_CALL=app_listing_create.txn

COMBINED=create.txn


ASSEMBLY=`../sandbox exec "cat $LISTING_NAME.tok | base64 -w0"`

echo "$ASSEMBLY"

echo "Creating Txns"
$GCMD app call --app-id $APP_ID -f $CREATOR_ACCT -o $APP_CALL \
	--app-arg "str:create" \
	--app-arg "int:$LISTING_PRICE"  \
	--app-arg "b64:$ASSEMBLY" 


$GCMD clerk send -a 5000000 -f $CREATOR_ACCT -t $CONTRACT_ACCT -o $SEED_ACCT
$GCMD asset send -a 0 --assetid $ASA_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT -o $ASA_OPT_IN
$GCMD asset send -a 1 --assetid $ASA_ID -f $CREATOR_ACCT  -t $CONTRACT_ACCT -o $ASA_SEND 

$GCMD asset config --assetid $ASA_ID  \
	--manager     $CREATOR_ACCT \
	--new-manager $CONTRACT_ACCT \
	--new-freezer $CONTRACT_ACCT \
	--new-reserve $CONTRACT_ACCT \
	--new-clawback $CONTRACT_ACCT \
	-o $ASA_CFG 

$GCMD asset send -a 0 --assetid $PRICE_ASA_ID -f $CONTRACT_ACCT -t $CONTRACT_ACCT -o $PRICE_OPT_IN 
$GCMD asset send -a $LISTING_PRICE --assetid $PRICE_ASA_ID -f $PLATFORM_ACCT -t $CONTRACT_ACCT -o $PRICE_SEND 

echo "Combining Txns"
../sandbox exec "cat $APP_CALL $SEED_ACCT $ASA_OPT_IN $PRICE_OPT_IN $ASA_SEND $PRICE_SEND $ASA_CFG > $COMBINED"

echo "Grouping/Splitting Txns"
$GCMD clerk group -i $COMBINED  -o $COMBINED
$GCMD clerk split -i $COMBINED  -o split

echo "Signing individual Txns"
$GCMD clerk sign -i split-0 -o $APP_CALL
$GCMD clerk sign -i split-1 -o $SEED_ACCT
$GCMD clerk sign -i split-4 -o $ASA_SEND
$GCMD clerk sign -i split-6 -o $ASA_CFG


echo "Signing contract acct txns"
$GCMD clerk sign -i split-2 -p $LISTING_NAME -o $ASA_OPT_IN 
$GCMD clerk sign -i split-3 -p $LISTING_NAME -o $PRICE_OPT_IN 
echo "Signing tx with delegate sig"
$GCMD clerk sign -i split-5 -L $SIGNED_DELEGATE -o $PRICE_SEND


echo "Combining Txns"
../sandbox exec "cat $APP_CALL $SEED_ACCT $ASA_OPT_IN $PRICE_OPT_IN $ASA_SEND $PRICE_SEND $ASA_CFG > $COMBINED"

echo "Sned it"
$GCMD clerk rawsend -f $COMBINED
