#!/bin/bash

../sandbox goal clerk dryrun -t tag.txn -o create-tag.json --dryrun-dump
../sandbox exec "cat create-tag.json" > create-tag.json
tealdbg debug platform-approval.teal -i 'http://localhost:8980' -d create-tag.json
