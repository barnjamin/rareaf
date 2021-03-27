#!/bin/bash

TXN_FNAME=make_platform.txn
PLATFORM_ACCT=NFMVG5PCLPEWGL5ACNHYEZOIUHXJBUW4SI754W6APBCCRUVVJKRQOAFAE4

./sandbox goal asset create --name rareaf --unitname raf --total 10000 -s -o $TXN_FNAME --creator $PLATFORM_ACCT

./sandbox goal clerk rawsend -f$TXN_FNAME
