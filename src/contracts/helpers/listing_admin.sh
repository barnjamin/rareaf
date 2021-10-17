#!/bin/bash
source ./vars.sh

make_nft=false
create_listing=true
tag_listing=false
untag_listing=false
reprice_listing=false
delete_listing=false
purchase_listing=false

app_id=54
app_addr=3Z2RSO2F5NJ3GWC4TN6ZQVMJ6EGH6ZZCHLF4PAEK2FNE4ZXKO4TTLEY3UQ

nft_id=28

listing_name=listing.teal

listing_tmpl=$SRCDIR/listing.tmpl.teal
listing_src=$SRCDIR/$listing_name


echo "Recompile teal"
cd $PYSRCDIR
python3 listing.py

cd $SRCDIR
cp $listing_tmpl $listing_src
nonce=`openssl rand -hex 32`

sed -i "s/TMPL_APP_ID/$app_id/" $listing_src
sed -i "s/TMPL_NONCE/0x$nonce/" $listing_src

$SB copyTo $listing_src 

LISTING=`$GOAL clerk compile $listing_name |awk '{print $2}'|tr '\r' ' '`

echo $LISTING


if $make_nft; then
    echo "Making nft"
    nft_id=`$GOAL asset create --creator $CREATOR \
                --asseturl="ipfs://deadbeef" \
                --decimals=0 \
                --name="NFT" \
                --unitname="nft" \
                --total=1 | grep 'Created asset' | awk '{print $6}'`
    echo "Created NFT: $nft_id"
fi

if $create_listing; then
    echo "Creating listing"

    echo "Making transactions"
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

    $SB exec "cat seed.txn app-optin.txn nft-optin.txn nft-send.txn rekey.txn > create.txn"

    $GOAL clerk rawsend -f create.txn
fi

if $tag_listing; then
    echo "Tagging listing"
fi

if $untag_listing; then
    echo "Untagging listing"
fi

if $reprice_listing; then
    echo "Repricing listing"
fi

if $delete_listing; then
    echo "Deleting listing"
fi

if $purchase_listing; then
    echo "Purchasing listing"
fi