#!/bin/bash

../sandbox goal clerk dryrun -t create.txn -o create-dryrun.json --dryrun-dump
../sandbox exec "cat create-dryrun.json" > create-dryrun.json
tealdbg debug platform-approval.teal -i 'http://localhost:8980' -d create-dryrun.json -g 0
