#!/bin/bash

CREATOR=MNSKOVSAY3ZDU3I3IB3KLO4HVRAP3PXKTIERMEVYYS463Y3UKTAS6NNIYQ
PRICE=500
ASSET=2


TMPL_CREATOR_ADDR=`python3 -c "import base64;from algosdk.encoding import decode_address;print('b64('+base64.b64encode(decode_address('$CREATOR')).decode('ascii')+')')"`
echo $TMPL_CREATOR_ADDR

TMPL_PRICE_MICROALGOS=`python3 -c "import base64;print('b64('+base64.b64encode(($PRICE).to_bytes(8,'big')).decode('ascii') + ')')"`
echo $TMPL_PRICE_MICROALGOS

TMPL_ASSET_ID=`python3 -c "import base64;print('b64(' + base64.b64encode(($ASSET).to_bytes(8,'big')).decode('ascii') + ')')"`
echo $TMPL_ASSET_ID
