#!/bin/bash
source ./vars.sh

create_app=false
seed_app=false

create_price_tokens=true
create_tag_tokens=false

destroy_price_tokens=false
destroy_tag_tokens=false
delete_app=false

cd $PYSRCDIR
#python3 application.py

cd $SRCDIR
$SB copyTo $APP_NAME
$SB copyTo $CLEAR_NAME

$GOAL clerk compile $APP_NAME
$GOAL clerk compile $CLEAR_NAME

cd $HELPDIR

if $create_app; then
    echo "Creating application"
    app_id=`$GOAL app create --creator $ADMIN \
        --approval-prog $APP_NAME \
        --clear-prog $CLEAR_NAME\
        --global-byteslices 16 \
        --global-ints 16 \
        --local-ints 1 \
        --local-byteslices 1  | grep 'Created app' |awk '{print $6}' | tr -d '\r'`
fi

echo "App ID: $app_id"


app_addr=`$GOAL app info --app-id $app_id | grep 'Application account' | awk '{print $3}' | tr -d '\r'`
echo "App Address: $app_addr"

# Write app id and address to files so we can re-use them in other scripts
echo "$app_id" > ./app.id
echo "$app_addr" > ./app.addr


if $seed_app; then
    echo "Seeding application addresss"
    $GOAL clerk send -f $ADMIN  -t $app_addr -a 5000000 
fi

if $create_price_tokens; then
    # First create some fake ASAs we're mirroring
    echo "Creating fake usdc/usdt"
    created_1=`$GOAL asset create --creator $ADMIN \
                --asseturl="https://circle.com" \
                --decimals=6 \
                --name="USDC" \
                --unitname="USDC" \
                --total=100000000000 | grep 'Created asset' | awk '{print $6}' | tr -d '\r'`

    created_2=`$GOAL asset create --creator $ADMIN \
                --asseturl="https://tether.com" \
                --decimals=6 \
                --name="Tether USDt" \
                --unitname="USDt" \
                --total=100000000000 | grep 'Created asset' | awk '{print $6}'| tr -d '\r'`


    ## Now create App specific tokens
    #echo "Creating price tokens"
    #$GOAL app call --app-id $app_id -f $ADMIN \
    #            --app-arg "str:create_price" \
    #            --foreign-asset $created_1

    #$GOAL app call --app-id $app_id -f $ADMIN \
    #            --app-arg "str:create_price" \
    #            --foreign-asset $created_2
fi

if $destroy_price_tokens; then 
    echo "Destroying price tokens"
    IDS=(`$GOAL account info -a $app_addr | grep "raf:px" | grep supply | awk '{print $2}' | tr -d ","`)
    for asset_id in "${IDS[@]}"
    do
            echo "Deleting token for $asset_id"
            $GOAL app call --app-id $app_id -f $ADMIN \
                --app-arg "str:destroy_price" \
                --foreign-asset $asset_id 

    done
fi


if $destroy_tag_tokens; then
    echo "Destroying Tag tokens"
    IDS=(`$GOAL account info -a $app_addr | grep "raf:tag" | grep supply | awk '{print $2}' | tr -d ","`)
    for asset_id in "${IDS[@]}"
    do
            echo "Deleting token for $asset_id"
            $GOAL app call --app-id $app_id -f $ADMIN \
                --app-arg "str:destroy_tag" \
                --foreign-asset $asset_id 

    done
fi

if $create_tag_tokens; then
    echo "Create Tag tokens"
    TAGS=("art" "picture" "video" "gif" "meme" "pixel" "landscape" "portrait")
    for i in "${TAGS[@]}"
    do
        $GOAL app call --app-id $app_id -f $ADMIN \
            --app-arg "str:create_tag" \
            --app-arg "str:$i"
    done
fi

if $delete_app; then
    echo "Deleting app"
    $GOAL app delete --app-id $app_id -f $ADMIN
fi
