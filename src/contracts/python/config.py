from pyteal import Bytes, Tmpl, Int
import json
import os

def get_config():
    config = None
    with open('../../../config.json', 'r') as f:
        config = json.load(f)

    for k,v in os.environ.items():
        if k[:5] == "TMPL_":
            config['application'][k[5:].lower()] = v

    return config


configuration = get_config()

listing_key   = Bytes("listing")

tag_key       = Bytes("tag:") 

platform_fee  = Tmpl.Int("TMPL_FEE_AMT")
platform_addr = Tmpl.Bytes("TMPL_OWNER_ADDR")
platform_admin= Tmpl.Bytes("TMPL_ADMIN_ADDR")

app_id        = Tmpl.Int("TMPL_APP_ID")
price_token   = Tmpl.Int("TMPL_PRICE_ID")

seed_amt      = Int(int(configuration['application']['seed_amt']))
max_price     = Int(int(configuration['application']['max_price']))

action_create  = Bytes("create")
action_tag     = Bytes("tag")  
action_untag   = Bytes("untag")  
action_iprice  = Bytes("price_increase")
action_dprice  = Bytes("price_decrease")
action_delete  = Bytes("delete")
action_purchase= Bytes("purchase")
action_safety  = Bytes("safety")