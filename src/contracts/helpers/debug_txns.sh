#!/bin/bash

mv /mnt/c/Users/Ben/Downloads/grouped.txns .
../sandbox copy grouped.txns 
../sandbox goal clerk dryrun -t grouped.txns
