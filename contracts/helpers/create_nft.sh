#!/bin/bash

TXN_FNAME=make_nft.txn
CREATOR_ACCT=OVMCDUOLZQX23CIKYEUTBCUWW44H6IYF64LY5736HAV5TQNP77JKS45YZA

./sandbox goal asset create --name nifty --unitname nft --total 1 -s -o $TXN_FNAME --creator $CREATOR_ACCT

./sandbox goal clerk rawsend -f$TXN_FNAME
