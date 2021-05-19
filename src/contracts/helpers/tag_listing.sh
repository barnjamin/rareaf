#!/bin/bash
source ./vars.sh


APP_TAG_CALL=app_tag.txn
TAG_OPTIN=tag_optin.txn
TAG_XFER=tag_xfer.txn

TAG_TXN=tag.txn

TAG_ID=11

# Application call to make sure im the owner 
# Pass tag as ForeignAsset to check that its managed by platform
$GCMD app call --app-id $APP_ID \
	-f $CREATOR_ACCT \
       	--approval-prog $APP_NAME \
	--clear-prog $CLEAR_NAME \
	--app-arg "b64:$b64_tag_func" \
	--foreign-asset $TAG_ID  \
	-o $APP_TAG_CALL

# Opt contract into asset 
$GCMD asset send -a 0 \
	-f $CONTRACT_ACCT \
	-t $CONTRACT_ACCT \
       	--assetid $TAG_ID \
	-o $TAG_OPTIN

# Asset Xfer from platform addr to contract addr
$GCMD asset send -a 1 \
	-f $PLATFORM_ACCT \
	-t $CONTRACT_ACCT \
	--assetid $TAG_ID \
	-o $TAG_XFER

../sandbox exec "cat $APP_TAG_CALL $TAG_OPTIN $TAG_XFER > $TAG_TXN"

$GCMD clerk group -i $TAG_TXN -o $TAG_TXN

$GCMD clerk split -i $TAG_TXN -o tag

$GCMD clerk sign -i tag-0 -o $APP_TAG_CALL
$GCMD clerk sign -i tag-1 -o $TAG_OPTIN -p $LISTING_NAME
$GCMD clerk sign -i tag-2 -o $TAG_XFER -L $SIGNED_DELEGATE


../sandbox exec "cat $APP_TAG_CALL $TAG_OPTIN $TAG_XFER > $TAG_TXN"

$GCMD clerk rawsend -f $TAG_TXN
