#!/bin/bash

source ./vars.sh

APP_DELETE_CALL=app_listing_delete.txn
PRICE_CLOSE=price_close.txn
ASA_CLOSE=asa_close.txn
ASA_CFG=asa_cfg.txn
ALGO_CLOSE=algo_close.txn

TXN_FILE=delete.txn

echo "appcall"
$GCMD app call --app-id $APP_ID \
	-f $CREATOR_ACCT \
       	--approval-prog $APP_NAME \
	--clear-prog $CLEAR_NAME \
	--app-arg "b64:$b64_delete_func" \
	-o $APP_DELETE_CALL


echo "price return"
$GCMD asset send \
	--assetid $PRICE_ASA_ID \
	-f $CONTRACT_ACCT \
	-t $PLATFORM_ACCT \
	-c $PLATFORM_ACCT \
	-a 0 \
	-o $PRICE_CLOSE

echo "asa cfg"
$GCMD asset config --assetid $ASA_ID  \
	--manager $CONTRACT_ACCT \
	--creator $CREATOR_ACCT \
	--new-manager  $CREATOR_ACCT \
	--new-freezer  $CREATOR_ACCT \
	--new-reserve  $CREATOR_ACCT \
	--new-clawback $CREATOR_ACCT \
	-o $ASA_CFG

echo "asa return"
$GCMD asset send \
	--assetid $ASA_ID \
	-f $CONTRACT_ACCT \
	-t $CREATOR_ACCT \
	-c $CREATOR_ACCT \
	-a 0 \
	-o $ASA_CLOSE

echo "algo return"
$GCMD clerk send -a 0 \
	-f $CONTRACT_ACCT \
	-t $CREATOR_ACCT \
	-c $CREATOR_ACCT \
	-o $ALGO_CLOSE

../sandbox exec "cat $APP_DELETE_CALL $PRICE_CLOSE $ASA_CLOSE $ASA_CFG $ALGO_CLOSE > $TXN_FILE"

$GCMD clerk group -i $TXN_FILE -o $TXN_FILE
$GCMD clerk split -i $TXN_FILE  -o delete

$GCMD clerk sign -i delete-0 -o $APP_DELETE_CALL
$GCMD clerk sign -i delete-1 -p $LISTING_NAME -o $PRICE_CLOSE 
$GCMD clerk sign -i delete-2 -p $LISTING_NAME -o $ASA_CLOSE
$GCMD clerk sign -i delete-3 -p $LISTING_NAME -o $ASA_CFG
$GCMD clerk sign -i delete-4 -p $LISTING_NAME -o $ALGO_CLOSE 

../sandbox exec "cat $APP_DELETE_CALL $PRICE_CLOSE $ASA_CLOSE $ASA_CFG $ALGO_CLOSE > $TXN_FILE"

$GCMD clerk rawsend -f $TXN_FILE 
