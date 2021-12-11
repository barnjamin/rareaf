#!/bin/bash
source ./vars.sh

make_nft=false
create_listing=false
tag_listing=false
untag_listing=false
reprice_listing=false
delete_listing=true
purchase_listing=false

echo "Using AppId: $app_id ($app_addr)"

listing_name=listing.teal
listing_tmpl=$SRCDIR/listing.tmpl.teal
listing_src=$SRCDIR/$listing_name

price_id=11
tag_id=27

if $make_nft; then
    echo "Making nft"
    nft_id=`$GOAL asset create --creator $CREATOR \
                --asseturl="ipfs://deadbeef" \
                --decimals=0 \
                --name="NFT" \
                --unitname="nft" \
                --total=1 | grep 'Created asset' | awk '{print $6}' |tr -d '\r'`
    echo "Created NFT: $nft_id"

    echo "$nft_id" > nft.id
fi

if $create_listing; then
    echo "Creating listing..."

    echo "Create new teal contract"
    cd $PYSRCDIR
    #python3 listing.py

    cd $SRCDIR
    cp $listing_tmpl $listing_src
    nonce=`openssl rand -hex 32`
    sed -i "s/TMPL_APP_ID/$app_id/" $listing_src
    sed -i "s/TMPL_NONCE/0x$nonce/" $listing_src
    $SB copyTo $listing_src 

    cd $HELPDIR
    listing_addr=`$GOAL clerk compile $listing_name |awk '{print $2}'|tr -d '\r'`
    echo "$listing_addr" > listing.addr


    echo "Making transactions"
    # Seed
    $GOAL clerk send -f $CREATOR -t $listing_addr -a 1000000 -o seed.txn

    # Opt into app
    $GOAL app optin -f $listing_addr --app-id $app_id -o app-optin.txn

    # Opt into NFT
    $GOAL asset send -f $listing_addr -t $listing_addr \
        --assetid $nft_id -a 0 -o nft-optin.txn

    # Xfer NFT
    $GOAL asset send -f $CREATOR -t $listing_addr \
        --assetid $nft_id -a 1 -o nft-send.txn

    # Rekey
    $GOAL clerk send -f $listing_addr -t $listing_addr \
        -a 0 --rekey-to $app_addr -o rekey.txn

    # Group/Split
    echo "Grouping/Splitting"
    $SB exec "cat seed.txn app-optin.txn nft-optin.txn nft-send.txn rekey.txn > create.txn"
    $GOAL clerk group -i create.txn -o create.txn
    $GOAL clerk split -i create.txn -o create

    echo "Signing"
    # Sign
    echo "seed"
    $GOAL clerk sign -i create-0 -o seed.txn

    echo "appoptin"
    $GOAL clerk sign -i create-1 -o app-optin.txn -p listing.teal

    echo "nftoptin"
    $GOAL clerk sign -i create-2 -o nft-optin.txn -p listing.teal

    echo "nftsend"
    $GOAL clerk sign -i create-3 -o nft-send.txn 

    echo "rekey"
    $GOAL clerk sign -i create-4 -o rekey.txn -p listing.teal

    echo "Grouping and sending"
    $SB exec "cat seed.txn app-optin.txn nft-optin.txn nft-send.txn rekey.txn > create.txn"
    $GOAL clerk rawsend -f create.txn
fi

if $tag_listing; then
    echo "Tagging listing"
    tag_id=27
    $GOAL app call --app-id $app_id -f $CREATOR \
        --app-arg "str:tag" \
        --foreign-asset $tag_id \
        --app-account $listing_addr  

fi

if $untag_listing; then
    echo "Untagging listing"
    $GOAL app call --app-id $app_id -f $CREATOR \
        --app-arg "str:untag" \
        --foreign-asset $tag_id \
        --app-account $listing_addr  
fi

if $reprice_listing; then
    echo "Setting price"
    $GOAL app call --app-id $app_id -f $CREATOR \
        --app-arg "str:reprice" \
        --app-arg "int:1000" \
        --foreign-asset $price_id \
        --app-account $listing_addr 

    echo "Lowering price"
    $GOAL app call --app-id $app_id -f $CREATOR \
        --app-arg "str:reprice" \
        --app-arg "int:100" \
        --foreign-asset $price_id \
        --app-account $listing_addr 
fi

if $delete_listing; then
    echo "Deleting listing"

    $GOAL app call --app-id $app_id -f $CREATOR \
        --app-arg "str:delete" \
        --foreign-asset $nft_id \
        --foreign-asset $price_id \
        --app-account $listing_addr  -o app_call.txn

    $GOAL app closeout --app-id $app_id -f $listing_addr -o app_close.txn
    $GOAL clerk send -f $listing_addr -t $CREATOR -a 0 -c $CREATOR -o algo_close.txn

    $SB exec "rm close.txn"

    $SB exec "cat app_call.txn app_close.txn algo_close.txn > close.txn"
    $GOAL clerk group -i close.txn -o close.txn

    $GOAL clerk split -i close.txn -o close

    $GOAL clerk sign -i close-0 -o app_call.txn
    $GOAL clerk sign -i close-1 -o app_close.txn -p $listing_name
    $GOAL clerk sign -i close-2 -o algo_close.txn -p $listing_name

    $SB exec "cat app_call.txn app_close.txn algo_close.txn > close.txn"

    $GOAL clerk rawsend -f close.txn

fi

if $purchase_listing; then
    echo "Purchasing listing"
fi
