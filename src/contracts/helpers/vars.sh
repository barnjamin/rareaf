#!/bin/bash
echo "Sourcing vars"

export GCMD="../sandbox goal"

export PYSRCDIR=~/rareaf/src/contracts/python
export SRCDIR=~/rareaf/src/contracts/

export LISTING_NAME=listing.teal
export LISTING_TEMPLATE=listing.tmpl.teal

export APP_TMPL_NAME=platform-approval.tmpl.teal
export APP_NAME=platform-approval.teal

export CLEAR_TMPL_NAME=platform-clear.tmpl.teal
export CLEAR_NAME=platform-clear.teal

export PLATFORM_TMPL_NAME=platform-owner.tmpl.teal
export PLATFORM_NAME=platform-owner.teal

export LISTING_PRICE=1000
export NFT_ASA_ID=4

export FEE_AMT=1000000
export SEED_AMT=5000000

export TMPL_PRICE_ID=7
export TMPL_APP_ID=4

export PLATFORM_ADMIN=7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM
export CREATOR_ACCT=6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI

export CREATOR_BYTES=`python3 -c "from algosdk import encoding;print('0x'+bytearray(encoding.decode_address('$CREATOR_ACCT')).hex())"`
export ADMIN_BYTES=`python3 -c "from algosdk import encoding;print('0x'+bytearray(encoding.decode_address('$PLATFORM_ADMIN')).hex())"`
export TMPL_ADMIN_ADDR=$ADMIN_BYTES


export b64_price=`python3 -c "import base64;print(base64.b64encode(($LISTING_PRICE).to_bytes(8,'big')).decode('ascii'))"`
export b64_asa_id=`python3 -c "import base64;print(base64.b64encode(($NFT_ASA_ID).to_bytes(8,'big')).decode('ascii'))"`

export b64_create_func=`echo -n "create"|base64 -w0`
export b64_delete_func=`echo -n "delete"|base64 -w0`
export b64_tag_func=`echo -n "tag"|base64 -w0`
export b64_untag_func=`echo -n "untag"|base64 -w0`
export b64_iprice_func=`echo -n "price_increase"|base64 -w0`
export b64_dprice_func=`echo -n "price_decrease"|base64 -w0`
export b64_purchase_func=`echo -n "purchase"|base64 -w0`


sbdir=`pwd`

cd $PYSRCDIR

python3 platform-app.py
python3 platform-owner.py
python3 listing.py

cd $sbdir

cp $SRCDIR/$PLATFORM_TMPL_NAME $PLATFORM_NAME
sed -i "s/TMPL_APP_ID/$TMPL_APP_ID/" $PLATFORM_NAME
sed -i "s/TMPL_ADMIN_ADDR/$ADMIN_BYTES/" $PLATFORM_NAME

../sandbox copyTo $PLATFORM_NAME

export PLATFORM_OWNER=`$GCMD clerk compile $PLATFORM_NAME|awk '{print $2}'|tr '\r' ' ' |xargs`
export OWNER_BYTES=`python3 -c "from algosdk import encoding;print('0x'+bytearray(encoding.decode_address('$PLATFORM_OWNER')).hex())"`


cd $PYSRCDIR

export TMPL_OWNER_ADDR=$OWNER_BYTES

export BLANK_HASH=`python3 blank-hash.py`
echo $BLANK_HASH

cd $sbdir

echo $BLANK_HASH

cp  $SRCDIR/$APP_TMPL_NAME $APP_NAME
sed -i "s/TMPL_PRICE_ID/$TMPL_PRICE_ID/" $APP_NAME
sed -i "s|TMPL_BLANK_HASH|b64($BLANK_HASH)|" $APP_NAME
sed -i "s/TMPL_OWNER_ADDR/$OWNER_BYTES/" $APP_NAME

../sandbox copyTo $APP_NAME


cp $SRCDIR/$CLEAR_TMPL_NAME $CLEAR_NAME
../sandbox copyTo $CLEAR_NAME


cp $SRCDIR/$LISTING_TEMPLATE $LISTING_NAME
sed -i "s/TMPL_APP_ID/$TMPL_APP_ID/" $LISTING_NAME
sed -i "s/TMPL_PRICE_ID/$TMPL_PRICE_ID/" $LISTING_NAME
sed -i "s/TMPL_CREATOR_ADDR/$CREATOR_BYTES/" $LISTING_NAME
sed -i "s/TMPL_ASSET_ID/b64($b64_asa_id)/" $LISTING_NAME
sed -i "s/TMPL_FEE_AMT/$FEE_AMT/" $LISTING_NAME
sed -i "s/TMPL_OWNER_ADDR/$OWNER_BYTES/" $LISTING_NAME
../sandbox copyTo $LISTING_NAME

export LISTING_ACCT=`$GCMD clerk compile $LISTING_NAME|awk '{print $2}'|tr '\r' ' ' | xargs`
echo $LISTING_ACCT
