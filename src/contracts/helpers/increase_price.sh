#!/bin/bash
source ./vars.sh


APP_PRICE_INCREASE_CALL=app_price_increase.txn
PRICE_INCREASE_TXN=price_increase.txn
PRICE_INCREASE_GROUP_TXN=tag.txn

# Application call to make sure im the owner 
# Pass tag as ForeignAsset to check that its managed by platform
$GCMD app call --app-id $APP_ID \
	-f $CREATOR_ACCT \
       	--approval-prog $APP_NAME \
	--clear-prog $CLEAR_NAME \
	--app-arg "b64:$b64_iprice_func" \
	--app-arg "int:100" \
	--foreign-asset $PRICE_ASA_ID \
	-o $APP_PRICE_INCREASE_CALL

# Opt contract into asset 
$GCMD asset send -a 100 \
	-f $PLATFORM_ACCT \
	-t $CONTRACT_ACCT \
       	--assetid $PRICE_ASA_ID \
	-o $PRICE_INCREASE_TXN


../sandbox exec "cat $APP_PRICE_INCREASE_CALL $PRICE_INCREASE_TXN > $PRICE_INCREASE_GROUP_TXN"

$GCMD clerk group -i $PRICE_INCREASE_GROUP_TXN -o $PRICE_INCREASE_GROUP_TXN

$GCMD clerk split -i $PRICE_INCREASE_GROUP_TXN -o iprice 

$GCMD clerk sign -i iprice-0 -o $APP_PRICE_INCREASE_CALL
$GCMD clerk sign -i iprice-1 -o $PRICE_INCREASE_TXN -L $SIGNED_DELEGATE


../sandbox exec "cat $APP_PRICE_INCREASE_CALL $PRICE_INCREASE_TXN > $PRICE_INCREASE_GROUP_TXN"

$GCMD clerk rawsend -f $PRICE_INCREASE_GROUP_TXN
