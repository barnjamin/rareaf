#!/bin/bash

txn_file=grouped.txns

mv /mnt/c/Users/Ben/Downloads/$txn_file .
../sandbox copy $txn_file
../sandbox goal clerk inspect $txn_file
../sandbox goal clerk dryrun -t $txn_file
