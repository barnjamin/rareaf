#!/bin/bash

echo "Sourcing vars"

export GCMD="../sandbox goal"

export SRCDIR=~/rareaf/src/contracts

export LISTING_NAME=listing.teal
export LISTING_TEMPLATE=listing.tmpl.teal
export APP_NAME=platform-approval.teal
export CLEAR_NAME=platform-clear.teal

export DELEGATE_NAME=platform-delegate.teal
export SIGNED_DELEGATE=platform-delegate.signed

export PLATFORM_FEE=1000000
export SEED_ALGOS=5000000

export LISTING_PRICE=500
export ASA_ID=18
export PRICE_ASA_ID=5
export APP_ID=4


export PLATFORM_ACCT=7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM
export CREATOR_ACCT=6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI

export CREATOR_BYTES=`python3 -c "from algosdk import encoding;print('0x'+bytearray(encoding.decode_address('$CREATOR_ACCT')).hex())"`

export b64_price=`python3 -c "import base64;print(base64.b64encode(($LISTING_PRICE).to_bytes(8,'big')).decode('ascii'))"`
export b64_asa_id=`python3 -c "import base64;print(base64.b64encode(($ASA_ID).to_bytes(8,'big')).decode('ascii'))"`

export b64_create_func=`echo -n "create"|base64 -w0`
export b64_delete_func=`echo -n "delete"|base64 -w0`
export b64_tag_func=`echo -n "tag"|base64 -w0`
export b64_untag_func=`echo -n "untag"|base64 -w0`
export b64_iprice_func=`echo -n "price_increase"|base64 -w0`
export b64_dprice_func=`echo -n "price_decrease"|base64 -w0`
export b64_purchase_func=`echo -n "purchase"|base64 -w0`

cd $SRCDIR

python3 platform-app.py
python3 platform-delegate.py
python3 listing.py

cp $LISTING_TEMPLATE $LISTING_NAME


sed -i "s/TMPL_CREATOR_ADDR/$CREATOR_BYTES/" $LISTING_NAME
sed -i "s/TMPL_ASSET_ID/b64($b64_asa_id)/" $LISTING_NAME

cd -

cp $SRCDIR/$LISTING_NAME .
cp $SRCDIR/$APP_NAME .
cp $SRCDIR/$CLEAR_NAME .
cp $SRCDIR/$DELEGATE_NAME .

../sandbox copy $SRCDIR/$LISTING_NAME
../sandbox copy $SRCDIR/$APP_NAME
../sandbox copy $SRCDIR/$CLEAR_NAME
../sandbox copy $SRCDIR/$DELEGATE_NAME

$GCMD app update --app-id $APP_ID --approval-prog $APP_NAME --clear-prog $CLEAR_NAME -f $PLATFORM_ACCT

export CONTRACT_ACCT=`../sandbox goal clerk compile -a$CREATOR_ACCT $LISTING_NAME|awk '{print $2}'|tr '\r' ' '`

echo "Signing delegate sig"
export DELEGATE=`../sandbox goal clerk compile -a$PLATFORM_ACCT $DELEGATE_NAME|awk '{print $2}'|tr '\r' ' '`
$GCMD clerk compile $DELEGATE_NAME -a $PLATFORM_ACCT -s -o $SIGNED_DELEGATE 
