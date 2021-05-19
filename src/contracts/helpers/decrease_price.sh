#!/bin/bash
source ./vars.sh


APP_PRICE_DECREASE_CALL=app_price_decrease.txn
PRICE_DECREASE_TXN=price_decrease.txn
PRICE_DECREASE_GROUP_TXN=tag.txn

# Application call to make sure im the owner 
# Pass tag as ForeignAsset to check that its managed by platform
$GCMD app call --app-id $APP_ID \
	-f $CREATOR_ACCT \
       	--approval-prog $APP_NAME \
	--clear-prog $CLEAR_NAME \
	--app-arg "b64:$b64_dprice_func" \
	--app-arg "int:100" \
	--foreign-asset $PRICE_ASA_ID \
	-o $APP_PRICE_DECREASE_CALL

# Opt contract into asset 
$GCMD asset send -a 100 \
	-t $PLATFORM_ACCT \
	-f $CONTRACT_ACCT \
       	--assetid $PRICE_ASA_ID \
	-o $PRICE_DECREASE_TXN


../sandbox exec "cat $APP_PRICE_DECREASE_CALL $PRICE_DECREASE_TXN > $PRICE_DECREASE_GROUP_TXN"

$GCMD clerk group -i $PRICE_DECREASE_GROUP_TXN -o $PRICE_DECREASE_GROUP_TXN

$GCMD clerk split -i $PRICE_DECREASE_GROUP_TXN -o dprice 

$GCMD clerk sign -i dprice-0 -o $APP_PRICE_DECREASE_CALL
$GCMD clerk sign -i dprice-1 -o $PRICE_DECREASE_TXN -p $LISTING_NAME


../sandbox exec "cat $APP_PRICE_DECREASE_CALL $PRICE_DECREASE_TXN > $PRICE_DECREASE_GROUP_TXN"

$GCMD clerk rawsend -f $PRICE_DECREASE_GROUP_TXN
