#!/bin/bash

TXN_FILE=grouped.txns

mv /mnt/c/Users/Ben/Downloads/$TXN_FILE .

../sandbox copyTo $TXN_FILE

../sandbox goal clerk inspect $TXN_FILE

#Stateless check
../sandbox goal clerk dryrun -t $TXN_FILE

#Stateful check
../sandbox goal clerk dryrun -t $TXN_FILE -o $TXN_FILE.json --dryrun-dump

# Local
#../sandbox copyFrom $TXN_FILE.json  .
#tealdbg remote $HOME/rareaf/src/contracts/platform-approval.teal  -v

#Remote
#../sandbox enter algod
#tealdbg debug -a 4 -d grouped.txns.json -v --remote-debugging-port 9392 --listen ""
