#!/bin/bash

TXN_FNAME=make_platform.txn
PLATFORM_ACCT=UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA

./sandbox goal asset create --name rareaf --unitname raf --total 10000 -s -o $TXN_FNAME --creator $PLATFORM_ACCT

./sandbox goal clerk rawsend -f$TXN_FNAME
