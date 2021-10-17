#!/bin/bash
source ./vars.sh

app_id=10
app_addr=""

#cp $SRCDIR/$LISTING_TEMPLATE $LISTING_NAME
#sed -i "s/TMPL_APP_ID/$TMPL_APP_ID/" $LISTING_NAME
#sed -i "s/TMPL_PRICE_ID/$TMPL_PRICE_ID/" $LISTING_NAME
#sed -i "s/TMPL_CREATOR_ADDR/$CREATOR_BYTES/" $LISTING_NAME
#sed -i "s/TMPL_ASSET_ID/b64($b64_asa_id)/" $LISTING_NAME
#sed -i "s/TMPL_FEE_AMT/$FEE_AMT/" $LISTING_NAME
#sed -i "s/TMPL_OWNER_ADDR/$OWNER_BYTES/" $LISTING_NAME
#../sandbox copyTo $LISTING_NAME

#export LISTING=`$GOAL clerk compile $LISTING_NAME|awk '{print $2}'|tr '\r' ' ' | xargs`


create_listing=true
tag_listing=false
untag_listing=false
reprice_listing=false
delete_listing=false
purchase_listing=false

if $create_listing; then

    # Seed
    $GOAL clerk send -f $CREATOR -t $LISTING -a 1000000 -o seed.txn

    # Opt into app
    $GOAL app optin -f $LISTING --app-id $app_id -o app-optin.txn

    # Opt into NFT
    $GOAL asset send -f $LISTING -t $LISTING --assetid $nft_id -a 0 -o nft-optin.txn

    # Xfer NFT
    $GOAL asset send -f $CREATOR -t $LISTING --assetid $nft_id -a 1 -o nft-send.txn

    # Rekey
    $GOAL clerk send -f $LISTING -t $LISTING -a 0 --rekey-to $app_addr -o rekey.txn

    $SB exec "cat seed.txn app-optin.txn nft-optin.txn nft-seed.txn rekey.txn > create.txn"
    $GOAL clerk group -i create.txn -o create.txn
    $GOAL clerk split -i create.txn -o create

    $GOAL clerk sign -i create-1 -o seed.txn
    $GOAL clerk sign -i create-2 -o app-optin.txn -p listing.teal
    $GOAL clerk sign -i create-3 -o nft-optin.txn -p listing.teal
    $GOAL clerk sign -i create-4 -o nft-send.txn 
    $GOAL clerk sign -i create-5 -o rekey.txn -p listing.teal

    $SB exec "cat seed.txn app-optin.txn nft-optin.txn nft-seed.txn rekey.txn > create.txn"

    #$GOAL clerk rawsend -f create.txn
fi

if $tag_listing; then
fi

if $untag_listing; then
fi

if $reprice_listing; then
fi

if $delete_listing; then
fi

if $purchase_listing; then
fi