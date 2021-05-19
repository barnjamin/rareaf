#!/bin/bash
source ./vars.sh

APP_UNTAG_CALL=app_untag.txn
UNTAG_XFER=untag_xfer.txn
UNTAG_TXN=untag.txn

TAG_ID=11

# Application call to make sure im the owner 
# Pass tag as ForeignAsset to check that its managed by platform
$GCMD app call --app-id $APP_ID \
	-f $CREATOR_ACCT \
       	--approval-prog $APP_NAME \
	--clear-prog $CLEAR_NAME \
	--app-arg "b64:$b64_untag_func" \
	--foreign-asset $TAG_ID  \
	-o $APP_UNTAG_CALL

# Opt contract into asset 
$GCMD asset send -a 0 \
	-f $CONTRACT_ACCT \
	-t $PLATFORM_ACCT \
       	--assetid $TAG_ID \
	--close-to $PLATFORM_ACCT \
	-o $UNTAG_XFER

../sandbox exec "cat $APP_UNTAG_CALL $UNTAG_XFER > $UNTAG_TXN"

$GCMD clerk group -i $UNTAG_TXN -o $UNTAG_TXN
$GCMD clerk split -i $UNTAG_TXN -o untag

$GCMD clerk sign -i untag-0 -o $APP_UNTAG_CALL
$GCMD clerk sign -i untag-1 -o $UNTAG_XFER -p $LISTING_NAME 


../sandbox exec "cat $APP_UNTAG_CALL $UNTAG_XFER > $UNTAG_TXN"

$GCMD clerk rawsend -f $UNTAG_TXN
