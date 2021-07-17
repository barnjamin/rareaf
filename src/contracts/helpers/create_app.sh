#!/bin/bash


source ./vars.sh

####
#Create Application
####
#echo "Creating application"
#$GCMD app create --creator $PLATFORM_ADMIN \
#	--approval-prog $APP_NAME \
#	--clear-prog $CLEAR_NAME\
#	--global-byteslices 0 \
#	--global-ints 0 \
#	--local-ints 0 \
#	--local-byteslices 16 



####
#Create price token
####


#create_txn=create_price_token.txn
#fee_pay=fee_pay.txn
#grouped=create.txns
#
#echo "Seeding contract account"
#$GCMD clerk send -f $PLATFORM_ADMIN -t $PLATFORM_OWNER -a $SEED_ALGOS
#
#echo  "Creating price token"
#$GCMD asset create --creator $PLATFORM_OWNER \
#	--total	1000000000 \
#	--decimals 0 \
#	--unitname "rafpx" \
#	--name "RAFPriceTokens" \
#	-o $create_txn \
#	--fee 0
#
#$GCMD clerk send -f $PLATFORM_ADMIN \
#	-t $PLATFORM_ADMIN \
#	-a 0 \
#	--fee 2000 \
#	-o $fee_pay 
#
#../sandbox exec "cat $fee_pay $create_txn > $grouped"
#
#$GCMD clerk group -i $grouped -o $grouped.grouped 
#$GCMD clerk split -i $grouped.grouped -o create
#
#$GCMD clerk sign -i create-0 -o $fee_pay.signed
#$GCMD clerk sign -i create-1 -p $PLATFORM_NAME  -o $create_txn.signed 
#
#../sandbox exec "cat $fee_pay.signed $create_txn.signed > $grouped.grouped.signed"
#
#echo "Sending to network"
#$GCMD clerk rawsend -f $grouped.grouped.signed



####
#Create tag tokens
####

#echo "Create Tag tokens"
#TAGS=("art" "picture" "video" "gif" "meme" "pixel" "landscape" "portrait")
#for i in "${TAGS[@]}"
#do
#	tag_create=tag_create.txn
#	fee_pay=fee_pay.txn
#	grouped=tag_grouped.txn
#
#	echo "Creating Tag:  $i"
#	$GCMD asset create --creator $PLATFORM_OWNER \
#		--total	10000 \
#		--decimals 0 \
#		--unitname "raf-tag" \
#		--asseturl "https://rare.af/tag/$i" \
#		--name "raf:$i" \
#		--fee 0 \
#		-o $tag_create
#
#	$GCMD clerk send -f $PLATFORM_ADMIN \
#		-t $PLATFORM_ADMIN \
#		-a 0 \
#		--fee 2000 \
#		-o $fee_pay 
#	
#	../sandbox exec "cat $fee_pay $tag_create > $grouped"
#	
#	$GCMD clerk group -i $grouped -o $grouped.grouped 
#	$GCMD clerk split -i $grouped.grouped -o create
#	
#	$GCMD clerk sign -i create-0 -o $fee_pay.signed
#	$GCMD clerk sign -i create-1 -p $PLATFORM_NAME  -o $tag_create.signed 
#	
#	../sandbox exec "cat $fee_pay.signed $tag_create.signed > $grouped.grouped.signed"
#
#	$GCMD clerk rawsend -f $grouped.grouped.signed
#done

####
#Update application
####
$GCMD app update -f $PLATFORM_ADMIN --app-id $TMPL_APP_ID --approval-prog $APP_NAME --clear-prog $CLEAR_NAME
