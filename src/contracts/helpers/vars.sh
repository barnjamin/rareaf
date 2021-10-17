#!/bin/bash
echo "Sourcing vars"

export S="$HOME/sandbox"
export SB="$S/sandbox"
export GOAL="$SB goal"

export PYSRCDIR="$HOME/rareaf/src/contracts/python"
export SRCDIR="$HOME/rareaf/src/contracts/"

export APP_NAME=approval.teal
export CLEAR_NAME=clear.teal
export LISTING_NAME=listing.teal
export LISTING_TEMPLATE=listing.tmpl.teal

export ADMIN=7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM
export CREATOR=6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI

if $GOAL account list |grep -q $ADMIN; then
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

cd $PYSRCDIR
python3 application.py
python3 listing.py

cd $SRCDIR
$SB copyTo $APP_NAME
$SB copyTo $CLEAR_NAME

$GOAL clerk compile $APP_NAME
$GOAL clerk compile $CLEAR_NAME

#export CREATOR_BYTES=`python3 -c "from algosdk import encoding;print('0x'+bytearray(encoding.decode_address('$CREATOR_ACCT')).hex())"`
#export ADMIN_BYTES=`python3 -c "from algosdk import encoding;print('0x'+bytearray(encoding.decode_address('$PLATFORM_ADMIN')).hex())"`

#cp $SRCDIR/$LISTING_TEMPLATE $LISTING_NAME
#sed -i "s/TMPL_APP_ID/$TMPL_APP_ID/" $LISTING_NAME
#sed -i "s/TMPL_PRICE_ID/$TMPL_PRICE_ID/" $LISTING_NAME
#sed -i "s/TMPL_CREATOR_ADDR/$CREATOR_BYTES/" $LISTING_NAME
#sed -i "s/TMPL_ASSET_ID/b64($b64_asa_id)/" $LISTING_NAME
#sed -i "s/TMPL_FEE_AMT/$FEE_AMT/" $LISTING_NAME
#sed -i "s/TMPL_OWNER_ADDR/$OWNER_BYTES/" $LISTING_NAME
#../sandbox copyTo $LISTING_NAME

#export LISTING_ACCT=`$GCMD clerk compile $LISTING_NAME|awk '{print $2}'|tr '\r' ' ' | xargs`
#echo $LISTING_ACCT

#export b64_price=`python3 -c "import base64;print(base64.b64encode(($LISTING_PRICE).to_bytes(8,'big')).decode('ascii'))"`
#export b64_asa_id=`python3 -c "import base64;print(base64.b64encode(($NFT_ASA_ID).to_bytes(8,'big')).decode('ascii'))"`