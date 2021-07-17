#!/bin/bash

funder="HGB4HTDSRYDUWUVUPR553NWZ3TDHUX72QNU4SIAI3WWIZ64DNPHFG2J6PY"



addr="7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM"
echo $addr
echo "genuine burger urge heart spot science vague guess timber rich olympic cheese found please then snack nice arrest coin seminar pyramid adult flip absorb apology"
../sandbox goal account import

addr="6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI"
echo $addr
echo "loan journey alarm garage bulk olympic detail pig edit other brisk sense below when false ripple cute buffalo tissue again boring manual excuse absent injury"
../sandbox goal account import

addr="DOG2QFGWQSFRJOQYW7I7YL7X7DEDIOPPBDV3XE34NMMXYYG32CCXXNFAV4"
echo $addr
echo "train rather absorb mouse tone scorpion group vacuum depth nothing assault silent fox relax depart lady hurdle million jaguar ensure define mule silk able order"
../sandbox goal account import


addr="7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM"
../sandbox goal clerk send -f$funder -t$addr -a50000000 -s -o send1.txn
addr="6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI"
../sandbox goal clerk send -f$funder -t$addr -a50000000 -s -o send2.txn
addr="DOG2QFGWQSFRJOQYW7I7YL7X7DEDIOPPBDV3XE34NMMXYYG32CCXXNFAV4"
../sandbox goal clerk send -f$funder -t$addr -a50000000 -s -o send3.txn

../sandbox exec "cat send1.txn send2.txn send3.txn > fund-accts.txn"
../sandbox goal clerk rawsend -f fund-accts.txn
