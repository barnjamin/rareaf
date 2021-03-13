#!/bin/bash

TXN_FNAME=make_nft.txn
CREATOR_ACCT=LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI

./sandbox goal asset create --name nifty --unitname nft --total 1 -s -o $TXN_FNAME --creator $CREATOR_ACCT

./sandbox goal clerk rawsend -f$TXN_FNAME
