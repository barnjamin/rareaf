#!/bin/bash
source ./vars.sh

create_app=true
seed_app=true

create_price_tokens=true
create_tag_tokens=true

destroy_price_tokens=false
destroy_tag_tokens=false
delete_app=false

cd $PYSRCDIR
python3 application.py

cd $SRCDIR
$SB copyTo $APP_NAME
$SB copyTo $CLEAR_NAME

$GOAL clerk compile $APP_NAME
$GOAL clerk compile $CLEAR_NAME

cd $HELPDIR



$GOAL app update -f $ADMIN --app-id $app_id \
    --approval-prog $APP_NAME \
    --clear-prog $CLEAR_NAME
