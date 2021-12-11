#!/bin/bash
echo "Sourcing vars"

export S="$HOME/sandbox"
export SB="$S/sandbox"
export GOAL="$SB goal"

export PYSRCDIR="$HOME/rareaf/src/contracts/python"
export SRCDIR="$HOME/rareaf/src/contracts/"
export HELPDIR="$SRCDIR/helpers"

export APP_NAME=approval.teal
export CLEAR_NAME=clear.teal
export LISTING_NAME=listing.teal
export LISTING_TEMPLATE=listing.tmpl.teal

export ADMIN="7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM"
export CREATOR="6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI"
export BUYER="DOG2QFGWQSFRJOQYW7I7YL7X7DEDIOPPBDV3XE34NMMXYYG32CCXXNFAV4"

if `$GOAL account list |grep -q $ADMIN`; then
    echo "Already have accounts"
else
    echo "Populating accounts"
    ./import_accts.sh
fi


export b64_create_func=`echo -n "create"|base64 -w0`
export b64_delete_func=`echo -n "delete"|base64 -w0`
export b64_tag_func=`echo -n "tag"|base64 -w0`
export b64_untag_func=`echo -n "untag"|base64 -w0`
export b64_reprice_func=`echo -n "reprice"|base64 -w0`
export b64_purchase_func=`echo -n "purchase"|base64 -w0`

export b64_config_func=`echo -n "config"|base64 -w0`
export b64_cprice_func=`echo -n "create_price"|base64 -w0`
export b64_dprice_func=`echo -n "destroy_price"|base64 -w0`
export b64_ctag_func=`echo -n "create_tag"|base64 -w0`
export b64_dtag_func=`echo -n "destroy_tag"|base64 -w0`

export app_id=`cat app.id`
export app_addr=`cat app.addr`
export nft_id=`cat nft.id`
export listing_addr=`cat listing.addr`

#export b64_price=`python3 -c "import base64;print(base64.b64encode(($LISTING_PRICE).to_bytes(8,'big')).decode('ascii'))"`
#export b64_asa_id=`python3 -c "import base64;print(base64.b64encode(($NFT_ASA_ID).to_bytes(8,'big')).decode('ascii'))"`
