#!/bin/bash

source ./vars.sh

TXN_FNAME=make_nft.txn
$GCMD asset create --name nifty --unitname nft --total 1 -s -o $TXN_FNAME --creator $CREATOR_ACCT 
$GCMD clerk rawsend -f$TXN_FNAME
