#!/bin/bash

source ./vars.sh

APP_PURCHASE_CALL=app_listing_purchase.txn
ALGO_PAY=algo_pay.txn
PRICE_CLOSE=price_close.txn
ASA_CLOSE=asa_close.txn
ASA_CFG=asa_cfg.txn
ALGO_CLOSE=algo_close.txn

TXN_FILE=purchase.txn

BUYER_ACCT=DOG2QFGWQSFRJOQYW7I7YL7X7DEDIOPPBDV3XE34NMMXYYG32CCXXNFAV4


echo "Opting buyer into asset"
$GCMD asset send --assetid $ASA_ID -f $BUYER_ACCT -t $BUYER_ACCT -a 0 


echo "app call"
$GCMD app call --app-id $APP_ID \
	-f $BUYER_ACCT \
       	--approval-prog $APP_NAME \
	--clear-prog $CLEAR_NAME \
	--app-arg "b64:$b64_purchase_func" \
	--app-account $CONTRACT_ACCT \
	--app-account $CREATOR_ACCT \
	-o $APP_PURCHASE_CALL

echo "algo pay"
$GCMD clerk send -a $LISTING_PRICE \
	-f $BUYER_ACCT \
	-t $CREATOR_ACCT \
	-o $ALGO_PAY

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
	--new-manager  $BUYER_ACCT \
	--new-freezer  $BUYER_ACCT \
	--new-reserve  $BUYER_ACCT \
	--new-clawback $BUYER_ACCT \
	-o $ASA_CFG

echo "asa send"
$GCMD asset send \
	--assetid $ASA_ID \
	-f $CONTRACT_ACCT \
	-t $BUYER_ACCT \
	-c $BUYER_ACCT \
	-a 0 \
	-o $ASA_CLOSE

echo "algo return"
$GCMD clerk send -a $PLATFORM_FEE  \
	-f $CONTRACT_ACCT \
	-t $PLATFORM_ACCT \
	-c $CREATOR_ACCT \
	-o $ALGO_CLOSE

../sandbox exec "cat $APP_PURCHASE_CALL $ALGO_PAY $ASA_CLOSE $PRICE_CLOSE $ASA_CFG $ALGO_CLOSE > $TXN_FILE"

$GCMD clerk group -i $TXN_FILE -o $TXN_FILE

$GCMD clerk split -i $TXN_FILE  -o purchase

$GCMD clerk sign -i purchase-0 -o $APP_PURCHASE_CALL
$GCMD clerk sign -i purchase-1 -o $ALGO_PAY

$GCMD clerk sign -i purchase-2 -p $LISTING_NAME -o $ASA_CLOSE
$GCMD clerk sign -i purchase-3 -p $LISTING_NAME -o $PRICE_CLOSE 
$GCMD clerk sign -i purchase-4 -p $LISTING_NAME -o $ASA_CFG
$GCMD clerk sign -i purchase-5 -p $LISTING_NAME -o $ALGO_CLOSE 

../sandbox exec "cat $APP_PURCHASE_CALL $ALGO_PAY $ASA_CLOSE $PRICE_CLOSE $ASA_CFG $ALGO_CLOSE > $TXN_FILE"

$GCMD clerk rawsend -f $TXN_FILE 
