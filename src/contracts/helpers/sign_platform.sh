#!/bin/bash

source ./vars.sh

SIGNED_DELEGATE=platform-delegate.signed

echo "Signing delegate sig"
./sandbox goal clerk compile $DELEGATE_NAME -a $PLATFORM_ACCT -s -o $SIGNED_DELEGATE 
./sandbox exec "cat $SIGNED_DELEGATE | base64 -w0" > platform.signed
cp platform.signed ~/rareaf/src/contracts/
