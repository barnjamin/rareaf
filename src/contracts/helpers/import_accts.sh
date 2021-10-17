#!/bin/bash

sb=~/sandbox/sandbox

funder="MRFAZACE2PCLQTHID324UNKYSRKA6FNWLTL7M7LS3O25OMHQJFA7ZHX52I"

addr="7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM"
echo $addr
MNEMONIC="genuine burger urge heart spot science vague guess timber rich olympic cheese found please then snack nice arrest coin seminar pyramid adult flip absorb apology"
$sb goal account import -m "$MNEMONIC"
$sb goal clerk send -f$funder -t$addr -a50000000 -s -o send1.txn

addr="6EVZZTWUMODIXE7KX5UQ5WGQDQXLN6AQ5ELUUQHWBPDSRTD477ECUF5ABI"
echo $addr
MNEMONIC="loan journey alarm garage bulk olympic detail pig edit other brisk sense below when false ripple cute buffalo tissue again boring manual excuse absent injury"
$sb goal account import -m "$MNEMONIC"
$sb goal clerk send -f$funder -t$addr -a50000000 -s -o send2.txn

addr="DOG2QFGWQSFRJOQYW7I7YL7X7DEDIOPPBDV3XE34NMMXYYG32CCXXNFAV4"
echo $addr
MNEMONIC="train rather absorb mouse tone scorpion group vacuum depth nothing assault silent fox relax depart lady hurdle million jaguar ensure define mule silk able order"
$sb goal account import -m "$MNEMONIC"
$sb goal clerk send -f$funder -t$addr -a50000000 -s -o send3.txn

$sb exec "cat send1.txn send2.txn send3.txn > fund-accts.txn"
$sb goal clerk rawsend -f fund-accts.txn
