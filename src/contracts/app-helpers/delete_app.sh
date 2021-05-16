#!/bin/bash


source ./vars.sh

# Create application
$GCMD app delete --app-id 9 \
	--from $PLATFORM_ACCT \
	-o app-delete.txn \
	-s 

$GCMD clerk rawsend -f app-delete.txn

