#!/bin/bash


source ./vars.sh

# Create application
#$GCMD app create --creator $PLATFORM_ACCT \
#	--approval-prog $APP_NAME \
#	--clear-prog $CLEAR_NAME\
#	--global-byteslices 0 \
#	--global-ints 0 \
#	--local-ints 0 \
#	--local-byteslices 16 
#
#$GCMD clerk rawsend -f app-create.txn
#
#echo  "Create price tokens"
#$GCMD asset create --creator $PLATFORM_ACCT \
#	--total	1000000000 \
#	--decimals 0 \
#	--unitname rafpx \
#	--name "RAF Price Tokens"


# echo "Create Tag tokens"
TAGS=("art" "picture" "video" "gif" "meme" "pixel" "landscape" "portrait")
for i in "${TAGS[@]}"
do
	echo "Creating $i"
	$GCMD asset create --creator $PLATFORM_ACCT \
		--total	10000 \
		--decimals 0 \
		--unitname raf-tag \
		--asseturl "https://rare.af/tag/$i" \
		--name "RAF:$i"
done

