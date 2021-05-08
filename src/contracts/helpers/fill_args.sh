#!/bin/bash

CREATOR=6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI
PRICE=500
ASSET=2

TMPL_CREATOR_ADDR=`python3 -c "import base64;from algosdk.encoding import decode_address;print('b64('+base64.b64encode(decode_address('$CREATOR')).decode('ascii')+')')"`
TMPL_PRICE_MICROALGOS=`python3 -c "import base64;print('b64('+base64.b64encode(($PRICE).to_bytes(8,'big')).decode('ascii') + ')')"`
TMPL_ASSET_ID=`python3 -c "import base64;print('b64(' + base64.b64encode(($ASSET).to_bytes(8,'big')).decode('ascii') + ')')"`

TMPL_PLATFORM_ID=1
TMPL_PLATFORM_FEE=1000
TMPL_PLATFORM_ADDR=7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM

eval "cat <<EOF
$(<listing.tmpl.teal)
EOF
" > listing.teal